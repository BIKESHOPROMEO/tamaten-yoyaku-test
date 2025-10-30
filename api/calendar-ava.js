export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbw0xAlekbbME08YaiMQMMB5ngfCDaMEWXicbyU1VlFl8quo1srYmibMD6BPWjdzj_Tb7g/exec";

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const response = await fetch(`${GAS_URL}?action=availability`);
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data); // ← これでOK！
    } catch (parseErr) {
      return res.status(500).json({ message: "JSONパース失敗", raw: text });
    }
  } catch (err) {
    return res.status(502).json({ message: "GAS取得エラー", error: err.message });
  }
}
