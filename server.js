const express = require("express");
const xrpl = require("xrpl");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

// Replace with your Testnet seed from https://xrpl.org/xrp-testnet-faucet.html
const SENDER_SECRET = "sEdV5nn59B8RWjzP2LYZ6pSJnyUwwJG";
const wallet = xrpl.Wallet.fromSeed(SENDER_SECRET);
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

let cashbackHistory = [];

app.post("/purchase", async (req, res) => {
  const { walletAddress } = req.body;

  if (!xrpl.isValidClassicAddress(walletAddress)) {
    return res.status(400).json({ error: "Invalid XRP wallet address" });
  }

  try {
    await client.connect();

    const ledgerInfo = await client.request({ command: "ledger_current" });
    const currentLedger = ledgerInfo.result.ledger_index;

    const amount = (100 * 0.05).toFixed(6); // 5% of $100 = 5 XRP

    let tx = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Destination: walletAddress,
      Amount: xrpl.xrpToDrops(amount),
      LastLedgerSequence: currentLedger + 20,
      Flags: 2147483648,
    };

    const filled = await client.autofill(tx);
    filled.LastLedgerSequence = currentLedger + 20;

    const signed = wallet.sign(filled);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error("Transaction failed: " + result.result.meta.TransactionResult);
    }

    cashbackHistory.unshift({
      to: walletAddress,
      amount,
      hash: signed.hash,
      time: new Date().toISOString()
    });

    await client.disconnect();

    res.json({
      txHash: signed.hash,
      explorerUrl: `https://testnet.xrpl.org/transactions/${signed.hash}`
    });
  } catch (err) {
    console.error("Transaction error:", err.message);
    res.status(500).json({ error: err.message || "Transaction failed" });
  }
});

app.get("/history", (req, res) => {
  res.json(cashbackHistory);
});

app.listen(PORT, () => {
  console.log(`🚀 XRP Cashback server running at http://localhost:${PORT}`);
});
