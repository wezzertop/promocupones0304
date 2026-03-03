
'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CheckCircle, ArrowRight, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

interface PublicationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: string
}

export default function PublicationSuccessModal({ isOpen, onClose, dealId }: PublicationSuccessModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#18191c] border border-[#2d2e33] p-6 text-left align-middle shadow-xl transition-all relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#2BD45A] opacity-10 blur-[60px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#2BD45A]/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-[#2BD45A]/30">
                    <CheckCircle className="w-8 h-8 text-[#2BD45A]" />
                  </div>
                  
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-white mb-2"
                  >
                    ¡Oferta Publicada!
                  </Dialog.Title>
                  
                  <div className="mt-2 space-y-4">
                    <p className="text-sm text-gray-400">
                      Tu oferta ha sido enviada correctamente y está pendiente de revisión por nuestro equipo de moderación.
                    </p>
                    
                    <div className="bg-[#222327] rounded-xl p-4 border border-[#2d2e33] flex items-start gap-3 text-left">
                      <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-white">Estado: Pendiente</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Te notificaremos en cuanto sea aprobada. Usualmente toma menos de 2 horas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 w-full">
                    <Link
                      href="/mis-publicaciones"
                      className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-[#2BD45A] px-4 py-3 text-sm font-bold text-black hover:bg-[#25b84e] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2BD45A] transition-all"
                      onClick={onClose}
                    >
                      <FileText size={18} />
                      Ver estado de mi publicación
                    </Link>
                    
                    <button
                      type="button"
                      className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-[#222327] px-4 py-3 text-sm font-medium text-gray-300 hover:bg-[#2d2e33] hover:text-white border border-[#2d2e33] transition-all"
                      onClick={onClose}
                    >
                      Cerrar y volver al inicio
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
