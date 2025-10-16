const xlsx = require("xlsx");
const Income = require("../models/Income");

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    let {icon, source, amount, date} = req.body;
    console.log("Request data:", {icon, source, amount, date});

    if (!source || !amount || !date) {
      return res.status(400).json({message: "All fields are required"});
    }

    if (isNaN(amount)) {
      return res.status(400).json({message: "Amount must be a valid number"});
    }
    amount = Math.round(amount * 100) / 100;

    const newIncome = new Income({
      userId,
      icon,
      source,
      amount,
      date: new Date(date), // Ensure date is correctly formatted
    });

    await newIncome.save();
    res.status(200).json(newIncome);
  } catch (error) {
    console.error("Error saving income:", error);
    res.status(500).json({message: "Server Error", error: error.message});
  }
};

// Get All Income Source
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({userId}).sort({date: -1});
    res.json(income);
  } catch (error) {
    res.status(500).json({message: "Server Error"});
  }
};

// Delete Income Source
exports.deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({message: "Income deleted successfully"});
  } catch (error) {
    res.status(500).json({message: "Server Error"});
  }
};

// Download Excel
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({ userId }).sort({ date: -1 });

    // ✅ round inside the map safely
    const data = income.map((item) => ({
      Source: item.source,
      Amount: Number(item.amount.toFixed(2)),
      Date: item.date.toISOString().split("T")[0],
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Income");

    const fileName = "income_details.xlsx";
    xlsx.writeFile(wb, fileName);

    res.download(fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        return res.status(500).json({ message: "Error downloading file" });
      }
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
