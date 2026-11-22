export function cleanPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 9 && /^[6789]/.test(digits)) {
    return `34${digits}`;
  }
  return digits;
}

export async function sendTelegramAlert(
  message: string,
  targetChatId?: string,
  inlineButtons?: { text: string; url: string }[][]
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = targetChatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[Telegram Alert Mocked - Missing env variables]:", message);
    return false;
  }
  try {
    const body: Record<string, any> = {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    };
    if (inlineButtons && inlineButtons.length > 0) {
      body.reply_markup = { inline_keyboard: inlineButtons };
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[Telegram Error response]", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Telegram Exception]", err);
    return false;
  }
}
