const axios = require("axios");
const {
  errorResponse,
  successResponse,
  warningResponse,
} = require("../helpers/response.helper");
const { text } = require("express");
const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

const sendTelegramMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const response = await axios.post(`${telegramUrl}/sendMessage`, {
      chat_id: process.env.GROUP_CHAT_ID,
      text: message,
    });

    successResponse(
      res,
      "Send message to telegram successfully",
      response.data,
    );
  } catch (err) {
    errorResponse(res, "Error send message to telegrams", err.message);
  }
};

const sendTelegramSoupport = async (req, res) => {
  try {
    const { message } = req.body;
    await axios.post(`${telegramUrl}/sendMessage`, {
      chat_id: process.env.SUPPORT_CHAT_ID,
      text: message,
    });

    successResponse(res, "Sending successfully");
  } catch (err) {
    errorResponse(res, "Error send support to telegram", err.message);
  }
};

module.exports = { sendTelegramMessage, sendTelegramSoupport };
