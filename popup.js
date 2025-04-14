document.getElementById("check").onclick = async function () {
  document.getElementById("status").textContent = "Durum: Çalışıyor...";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: checkUsers,
    },
    (results) => {
      if (chrome.runtime.lastError) {
        document.getElementById("status").textContent =
          "Hata: " + chrome.runtime.lastError.message;
        return;
      }

      const data = results[0].result;

      // Yeni pencereyi aç
      const newWindow = window.open("", "_blank", "width=400,height=400");
      newWindow.document.write(`
        <html>
          <head>
            <title>Takipçi Analiz Sonucu</title>
            <style>
              body {
                font-family: sans-serif;
                padding: 20px;
                background: #f9f9f9;
              }
              h3 {
                color: #333;
                text-align: center;
              }
              .user-list {
                max-height: 200px;
                overflow-y: auto;
                background: white;
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 8px;
              }
              .user-list li {
                padding: 5px 0;
                border-bottom: 1px dashed #eee;
              }
            </style>
          </head>
          <body>
            <h3>Takipçi Analiz Sonucu</h3>
            <p id="status" style="text-align: center; color: #555;">Durum: Beklemede</p>
            <ul id="result" class="user-list"></ul>
          </body>
        </html>
      `);

      const resultBox = newWindow.document.getElementById("result");
      const statusBox = newWindow.document.getElementById("status");

      if (data?.notFollowingBack?.length > 0) {
        statusBox.textContent = `Seni takip etmeyen ${data.notFollowingBack.length} kişi bulundu!`;
        data.notFollowingBack.forEach((user) => {
          let li = newWindow.document.createElement("li");
          li.textContent = user;
          resultBox.appendChild(li);
        });
      } else if (data?.message) {
        statusBox.textContent = data.message;
      } else {
        statusBox.textContent = "Liste bulunamadı.";
      }
    }
  );
};

function checkUsers() {
  const links = Array.from(document.querySelectorAll('a[href*="/"]'))
    .map((el) => el.textContent.trim())
    .filter((name) => name.length > 0);

  if (!window.followingList) {
    window.followingList = links;
    return {
      message: `Takip edilen ${links.length} kişi kaydedildi! Şimdi takipçiler sayfasına geç ve tekrar butona bas.`,
    };
  } else if (!window.followerList) {
    window.followerList = links;
    const notFollowingBack = window.followingList.filter(
      (user) => !window.followerList.includes(user)
    );
    delete window.followingList;
    delete window.followerList;
    return { notFollowingBack };
  } else {
    return { message: "Listeler zaten dolu. Lütfen sayfayı yenile." };
  }
}
