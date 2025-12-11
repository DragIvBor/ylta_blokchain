window.addEventListener("DOMContentLoaded", () => {
  const contractAddress = "0x1467DE28f4Cd6C9979C317743CE3345Fe04f81Cd";

  const abi = [
    {
      "inputs": [],
      "name": "getPot",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "number", "type": "uint256" }],
      "name": "guess",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "fund",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const connectBtn = document.getElementById("connectBtn");
  const playBtn = document.getElementById("playBtn");
  const guessInput = document.getElementById("guessInput");
  const potEl = document.getElementById("pot");
  const resultEl = document.getElementById("result");
  const fundBtn = document.getElementById("fundBtn");
  const withdrawBtn = document.getElementById("withdrawBtn");
  const withdrawAmountInput = document.getElementById("withdrawAmount");

  let provider, signer, contract;

  // -------------------------
  // Подключение MetaMask
  // -------------------------
  connectBtn.onclick = async () => {
    if (!window.ethereum) return alert("Установите MetaMask!");

    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      contract = new ethers.Contract(contractAddress, abi, signer);

      connectBtn.textContent = "Подключено!";
      connectBtn.disabled = true;

      await loadPot();

    } catch (err) {
      console.error(err);
      alert("Ошибка подключения: " + (err.data?.message || err.message));
    }
  };

  // -------------------------
  // Загрузка банка
  // -------------------------
  async function loadPot() {
    try {
      const pot = await contract.getPot();
      potEl.textContent = ethers.formatEther(pot);
    } catch (err) {
      console.error(err);
      alert("Ошибка получения банка: " + (err.data?.message || err.message));
    }
  }

  // -------------------------
  // Игра
  // -------------------------
  playBtn.onclick = async () => {
    if (!contract) return alert("Сначала подключите MetaMask.");

    const number = parseInt(guessInput.value);
    if (!number || number < 1 || number > 5) return alert("Введите число от 1 до 5.");

    try {
      resultEl.textContent = "Отправка транзакции...";

      const tx = await contract.guess(number, { value: ethers.parseEther("0.001") });
      const receipt = await tx.wait();

      // Декодируем событие
      const iface = new ethers.Interface(abi);
      const eventLog = receipt.logs
        .map(log => { try { return iface.parseLog(log); } catch { return null; } })
        .find(e => e && e.name === "NewGuess");

      if (eventLog) {
        const { won, reward } = eventLog.args;
        if (won) {
          resultEl.textContent = `🎉 Вы выиграли ${ethers.formatEther(reward)} ETH!`;
          resultEl.className = "result win";
        } else {
          resultEl.textContent = "❌ Вы не угадали.";
          resultEl.className = "result lose";
        }
      } else {
        resultEl.textContent = "Транзакция прошла, но событие не найдено.";
        resultEl.className = "result";
      }

      await loadPot();

    } catch (err) {
      console.error(err);
      resultEl.textContent = "Ошибка: " + (err.data?.message || err.message);
      resultEl.className = "result lose";
    }
  };

  // -------------------------
  // Пополнение банка (owner)
  // -------------------------
  fundBtn.onclick = async () => {
    if (!contract) return alert("Сначала подключите MetaMask.");

    let raw = prompt("Сколько ETH внести?");
    if (!raw) return;

    const amount = parseFloat(raw.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return alert("Введите число > 0.");

    try {
      const tx = await contract.fund({ value: ethers.parseEther(amount.toString()) });
      await tx.wait();
      alert("Банк пополнен!");
      await loadPot();
    } catch (err) {
      console.error(err);
      alert("Ошибка: " + (err.data?.message || err.message));
    }
  };

  // -------------------------
  // Вывод средств (owner)
  // -------------------------
  withdrawBtn.onclick = async () => {
    if (!contract) return alert("Сначала подключите MetaMask.");

    const raw = withdrawAmountInput.value.replace(",", ".");
    const amount = parseFloat(raw);
    if (isNaN(amount) || amount <= 0) return alert("Введите число > 0.");

    try {
      const tx = await contract.withdraw(ethers.parseEther(amount.toString()));
      await tx.wait();
      alert("Средства выведены!");
      await loadPot();
    } catch (err) {
      console.error(err);
      alert("Ошибка: " + (err.data?.message || err.message));
    }
  };
});
