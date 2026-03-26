'use client'

import { useEffect } from 'react'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface NativeAppBridgeProps {
  user: User | null
}

export default function NativeAppBridge({ user }: NativeAppBridgeProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    // 1. Listen for Deep Links (Google Auth Callback)
    const urlListener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('App opened with URL:', event.url)
      
      // Example URL: com.promocupones.cupoferta://auth/callback#access_token=...
      if (event.url.includes('/auth/callback')) {
        const url = new URL(event.url)
        // Redirect NEXT Router to the callback route with the hash components
        const hash = url.hash
        const search = url.search
        router.push(`/auth/callback${search}${hash}`)
      }
    })

    // 2. Setup Push Notifications if user is logged in
    const setupPush = async () => {
      if (!user) return

      try {
        let permStatus = await PushNotifications.checkPermissions()

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions()
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Push notification permission not granted')
          return
        }

        await PushNotifications.register()
      } catch (err) {
        console.error('Error during push notification setup:', err)
      }
    }

    setupPush()

    // 3. Listen for Push Registration Token
    const regListener = PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value)
      if (user) {
        // Guardar token en supabase
        const { error } = await (supabase
          .from('user_devices') as any)
          .upsert({ 
            user_id: user.id, 
            fcm_token: token.value,
            platform: Capacitor.getPlatform()
          }, { onConflict: 'user_id, fcm_token' })
          
        if (error) console.error('Error saving FCM token:', error)
      }
    })

    const regErrListener = PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error))
    })

    const pushRxListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification))
      // Opcional: Mostrar un Toast interno si la app está en primer plano
    })

    const pushActListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification))
      // Ejemplo: notification.notification.data.url -> router.push(url)
      const data = notification.notification.data
      if (data && data.url) {
        router.push(data.url)
      }
    })

    return () => {
      urlListener.then(l => l.remove())
      regListener.then(l => l.remove())
      regErrListener.then(l => l.remove())
      pushRxListener.then(l => l.remove())
      pushActListener.then(l => l.remove())
    }
  }, [router, supabase, user])

  return null
}
