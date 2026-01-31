import QRCode from "qrcode";

/**
 * Server-side QR code generation for PDF receipts
 * Returns base64 data URL
 */
export async function generateQRCodeDataUrl(
  content: string,
  options?: {
    size?: number;
    darkColor?: string;
    lightColor?: string;
  },
): Promise<string> {
  const {
    size = 150,
    darkColor = "#168D95",
    lightColor = "#FFFFFF",
  } = options || {};

  return QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "M",
  });
}
