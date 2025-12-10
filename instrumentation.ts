export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize WhatsApp when the server starts
    const { initializeWhatsApp } = await import('./lib/whatsapp-service');
    
    console.log('\n========================================');
    console.log('Starting WhatsApp initialization...');
    console.log('========================================\n');
    
    initializeWhatsApp().catch((error) => {
      console.error('Failed to initialize WhatsApp:', error);
    });
  }
}

