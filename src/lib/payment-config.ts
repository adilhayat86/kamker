export const manualPaymentConfig = {
  accountTitle: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_TITLE || "Kamker / XYZ Account",
  accountNumber: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER || "03XX-XXXXXXX",
  bankName: process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME || "JazzCash / EasyPaisa / Bank",
  whatsappNumber: process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP_NUMBER || "923000000000",
};

export function getPaymentWhatsappLink(message: string) {
  const cleanNumber = manualPaymentConfig.whatsappNumber.replace(/\D/g, "");

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
