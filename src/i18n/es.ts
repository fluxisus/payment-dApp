export const es = {
  // Common
  loading: "Cargando...",
  connecting: "Conectando...",

  // Navigation
  not_found_title: "404",
  not_found_description: "¡Ups! Página no encontrada",
  return_home: "Volver al Inicio",

  // Buttons
  proceed_to_payment: "Proceder al Pago",

  // Error messages
  wallet_connection_failed:
    "Error al conectar la billetera. Por favor, inténtalo de nuevo.",
  wallet_not_connected: "Billetera No Conectada",
  connect_wallet_first: "Conexión a billetera requerida",

  // Header
  connect_wallet: "Conectar Billetera",
  disconnect_wallet: "Desconectar",

  // Main actions
  charge: "Cobrar",
  pay: "Pagar",

  // Form fields
  enter_id: "Ingresar ID",
  token: "Token",

  // Balance section
  balance: "Saldo",
  no_supported_tokens: "No hay tokens compatibles disponibles en {network}",

  // Transaction history
  transaction_history: "Historial de Transacciones",
  loading_transactions: "Cargando transacciones...",
  no_transactions: "No se encontraron transacciones",
  received: "Recibido",
  sent: "Enviado",

  // Settings
  settings: "Configuración",
  dark_mode: "Modo Oscuro",
  language: "Idioma",
  select_language: "Seleccionar idioma",

  // Profile Menu
  copy_address: "Copiar Dirección",
  address_copied: "Dirección copiada",
  address_copied_desc: "Dirección de la billetera copiada al portapapeles",

  // Toast Messages
  success: "Éxito",
  error: "Error",
  warning: "Advertencia",
  info: "Información",
  transaction_sent: "Transacción Enviada",
  transaction_confirmed: "Transacción Confirmada",
  transaction_error: "Error en la Transacción",
  network_changed: "Red Cambiada",
  network_change_error: "Error al Cambiar de Red",
  wallet_connected: "Billetera Conectada",
  wallet_disconnected: "Billetera Desconectada",
  wallet_connection_error: "Error de Conexión de Billetera",
  metamask_not_available: "MetaMask No Disponible",
  metamask_not_available_desc:
    "Por favor, instala la extensión MetaMask o usa la aplicación móvil de MetaMask",
  qr_code_generated: "Código QR Generado",
  qr_code_copied: "Código QR Copiado",
  qr_code_error: "Error en el Código QR",
  payment_processing: "Procesando Pago",
  payment_success: "Pago Exitoso",
  payment_error: "Error en el Pago",
  charge_created: "Cobro Creado",
  charge_error: "Error en el Cobro",

  // Pay modal
  scanning_qr: "Escaneando código QR...",
  loading_camera: "Cargando cámara...",
  payment_details: "Detalles del Pago:",
  id: "ID:",
  amount: "Cantidad:",
  network: "Red:",
  address: "Dirección:",
  merchant: "Comerciante:",
  total: "Total:",
  network_mismatch: "Red incorrecta. Este pago requiere {network}.",
  switch_network: "Cambiar Red",
  stop_camera: "Detener Cámara",
  scan: "Escanear",
  paste: "Pegar",

  // Order modal
  order_details: "Detalles del Pedido",
  loading_order: "Cargando detalles del pedido...",
  merchant_information: "Información del Comerciante",
  tax_id: "ID fiscal:",
  from: "Desde:",
  identifier: "Identificador: {id}",
  unit_price: "Precio unitario:",
  quantity: "Cantidad:",
  payment_amount: "Monto del Pago:",
  recipient: "Destinatario:",
  transaction_status: "Estado de la Transacción",
  status: "Estado:",
  processing: "Procesando...",
  submitted: "Enviado",
  transaction_failed: "Transacción fallida: {error}",
  no_order_info: "No hay información de pedido disponible",

  // Errors
  clipboard_access_required: "Acceso al Portapapeles Requerido",
  clipboard_access_denied: "Acceso al Portapapeles Denegado",
  allow_clipboard_access:
    "Por favor, permite el acceso al portapapeles en la configuración de tu navegador e inténtalo de nuevo",
  allow_clipboard_reload:
    "Por favor, permite el acceso al portapapeles para pegar contenido. Es posible que debas recargar la página.",
  empty_clipboard: "Portapapeles Vacío",
  clipboard_empty_text: "Tu portapapeles está vacío o no contiene texto",
  camera_access_error: "Error de Acceso a la Cámara",
  allow_camera_access:
    "Por favor, permite el acceso a la cámara para escanear códigos QR",
  invalid_code: "Código Inválido",
  invalid_payment_code: "El contenido no es un código de pago NASPIP válido",
  processing_error: "Error de Procesamiento",
  error_reading_token: "Error al Leer el Token",
  failed_read_token: "No se pudo leer el token de pago",

  // Networks
  ethereum: "Ethereum",
  polygon: "Polygon",
  bsc: "BSC",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  avalanche: "Avalanche",
  base: "Base",
  goerli: "Goerli (Testnet)",
  mumbai: "Mumbai (Testnet)",
  sepolia: "Sepolia (Testnet)",
  unknown_network: "la red seleccionada",
  network_with_id: "Red {id}",

  // Charge modal
  additional_details: "Detalles Adicionales",
  description: "Descripción",
  enter_description: "Ingrese descripción",
  merchant_name: "Nombre del Comerciante",
  enter_merchant_name: "Ingrese nombre del comerciante",
  merchant_description: "Descripción del Comerciante",
  enter_merchant_description: "Ingrese descripción del comerciante",
  enter_tax_id: "Ingrese ID fiscal",
  create_payment: "Crear Pago",
};
