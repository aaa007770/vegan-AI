// api/analyze.js
export default async function handler(req, res) {
    // 1. 🌟 強制注入最高權限的 CORS 通行證（這是解除 Failed to fetch 的關鍵）
    res.status(200); // 先預設設為 200
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Content-Type'
    );

    // 2. 🌟 處理瀏覽器必經的 OPTIONS 預檢請求，直接回傳 200 結束
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 檢查是否為 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { base64Image, promptText } = req.body;
        
        // 從 Vercel 後台安全取出環境變數
        const apiKey = process.env.GEMINI_API_KEY; 
        
        if (!apiKey) {
            return res.status(500).json({ error: '後台尚未設定 GEMINI_API_KEY 環境變數。' });
        }

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
        
        // 4. 🌟 回傳最終成功結果，並再次確保帶有 CORS 標頭
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
