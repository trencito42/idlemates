import Swal from 'sweetalert2'

// Minimal, global SweetAlert2 setup with compact styling
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1800,
  timerProgressBar: true,
  background: 'rgb(17, 19, 32)',
  color: 'rgb(232, 233, 237)',
  iconColor: 'rgb(138, 92, 255)',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
  customClass: {
    popup: 'rounded-lg border border-accent/20 p-1.5',
    title: 'text-[11px] font-medium',
    container: 'mt-1'
  }
})

export const Alert = Swal.mixin({
  background: 'rgb(17, 19, 32)',
  color: 'rgb(232, 233, 237)',
  confirmButtonColor: 'rgb(138, 92, 255)',
  cancelButtonColor: 'rgb(59, 60, 74)',
  customClass: {
    popup: 'card border border-accent/20 p-3 rounded-lg',
    confirmButton: 'btn btn-xs',
    cancelButton: 'btn-secondary btn-xs',
    title: 'font-bold text-sm mb-1',
    htmlContainer: 'text-[11px] opacity-90'
  }
})

export const showSuccess = (message: string) => {
  Toast.fire({ icon: 'success', title: message })
}

export const showError = (message: string) => {
  Toast.fire({ icon: 'error', title: message })
}

export const showWarning = (message: string) => {
  Toast.fire({ icon: 'warning', title: message })
}

export const showInfo = (message: string) => {
  Toast.fire({ icon: 'info', title: message })
}

export const confirm = async (title: string, text?: string) => {
  const result = await Alert.fire({
    title,
    text,
    icon: 'question',
    iconColor: 'rgb(138, 92, 255)',
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    heightAuto: false,
    padding: '0.75rem'
  })
  return result.isConfirmed
}

export { Swal }
