import express from 'express';
import axios from 'axios';

const router = express.Router();

const API_KEY = 'apk.7d5d49e5b499093bbfe59b84a56a80f16fd2a7b54578536de68aa7c49af43503';
const API_BASE_URL = 'https://api-connect.eos.com/api/gdw/api';

router.post('/create-task', async (req, res) => {
  try {
    const response = await axios.post(API_BASE_URL, req.body, {
      params: { api_key: API_KEY },
      headers: { 'Content-Type': 'application/json' }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error creating task:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to create analysis task',
      error: error.response?.data || error.message
    });
  }
});

router.get('/get-results/:taskId', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${req.params.taskId}`, {
      headers: { 'x-api-key': API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error getting results:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to get analysis results',
      error: error.response?.data || error.message
    });
  }
});

export default router;
