async function test() {
  const payloadWithImage = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/webp",
              data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            }
          },
          { text: "Describe this image" }
        ]
      }
    ]
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyTestKey123`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadWithImage)
  });
  const data = await res.json();
  console.log('With inlineData webp: status', res.status, data.error?.message);
}
test();
