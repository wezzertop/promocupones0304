import Leaderboard from '@/components/gamification/Leaderboard'
import { Trophy, Star, Users, AlertTriangle, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Tabla de Clasificación | Promocupones',
  description: 'Descubre a los usuarios más activos de nuestra comunidad.',
}

export default function LogrosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Salón de la Fama
          <Trophy className="w-8 h-8 text-yellow-500" />
        </h1>
        <p className="text-zinc-400">
          Reconocemos a los miembros más valiosos de nuestra comunidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Leaderboard />
        </div>
        
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#2BD45A]" />
              ¿Cómo ganar XP?
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg text-[#2BD45A]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Publicar Ofertas</div>
                  <div className="text-sm text-zinc-400">+20 XP por cada oferta aprobada</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Comentar</div>
                  <div className="text-sm text-zinc-400">+5 XP por comentario útil</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg text-orange-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Recibir Votos</div>
                  <div className="text-sm text-zinc-400">+1 XP por cada voto positivo</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Referir Amigos</div>
                  <div className="text-sm text-zinc-400">Desbloquea insignias especiales</div>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Reglas de Juego Limpio
            </h3>
            <p className="text-sm text-zinc-300 mb-4">
              Para mantener una comunidad justa, aplicamos deducciones de XP por acciones negativas:
            </p>
            <ul className="space-y-3">
               <li className="flex items-start gap-3">
                <div className="bg-red-500/10 p-1.5 rounded-lg text-red-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Eliminar Comentarios</div>
                  <div className="text-xs text-red-300">-5 XP (se revierte la ganancia)</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-red-500/10 p-1.5 rounded-lg text-red-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Perder Votos (Likes)</div>
                  <div className="text-xs text-red-300">-1 XP si un usuario retira su voto</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-red-500/10 p-1.5 rounded-lg text-red-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Eliminar Publicaciones</div>
                  <div className="text-xs text-red-300">-20 XP (se revierte la ganancia)</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-[#2BD45A]/20 to-emerald-900/20 border border-[#2BD45A]/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">¡Sube de Nivel!</h3>
            <p className="text-sm text-zinc-300 mb-4">
              Desbloquea más enlaces de referido y destaca en la comunidad subiendo de nivel.
            </p>
            <div className="text-center">
              <a href="/publicar" className="inline-block bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold py-2 px-6 rounded-xl transition-colors">
                Empezar a ganar XP
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
