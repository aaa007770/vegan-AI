// api/analyze.js
export default async function handler(req, res) {
    // 1. 🌟 注入全開放的 CORS 標頭，徹底打通網域安全機制，防禦 Failed to fetch
    res.status(200); 
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Content-Type'
    );

    // 2. 攔截瀏覽器的 OPTIONS 預檢探路請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 限制必須為 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { base64Image, promptText } = req.body;
        
        // 🔒 從 Vercel 環境變數安全撈取金鑰
        const apiKey = process.env.GEMINI_API_KEY; 
        
        if (!apiKey) {
            return res.status(500).json({ error: '後端尚未設定 GEMINI_API_KEY 環境變數。' });
        }

        // 使用最新高速的 2.5-flash 模型端點
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                ]
            }]
        };

        const geminiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await geminiResponse.json();
        
        // 4. 回傳最終成功數據
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
