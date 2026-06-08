export const manualPaymentConfig = {
  accountTitle: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_TITLE || "adil hayat",
  accountNumber: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER || "03005314191",
  bankName: process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME || "EasyPaisa",
  whatsappNumber: process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP_NUMBER || "923005314191",
};

export function getPaymentWhatsappLink(message: string) {
  const cleanNumber = manualPaymentConfig.whatsappNumber.replace(/\D/g, "");

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
