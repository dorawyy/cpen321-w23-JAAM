const senderEmail = 'j.biden@example.com';
const receiverEmail = 'c.d@example.com';

const mockChatHistory = [
    {
      "_id": "1",
      "text": "Hello, this is from biden at 7:24.",
      senderEmail,
      receiverEmail,
      "timestamp": "2023-11-06T03:22:57.632Z",
      "__v": 0
    },
    {
      "_id": "2",
      "text": "Hello, this is from biden at 7:24.",
      senderEmail,
      receiverEmail,
      "timestamp": "2023-11-06T03:22:57.632Z",
      "__v": 0
    },
    {
      "_id": "3",
      "text": "Hello, this is from biden at 7:24.",
      senderEmail,
      receiverEmail,
      "timestamp": "2023-11-06T03:22:57.632Z",
      "__v": 0
    },
    {
      "_id": "4",
      "text": "Hello, this is from biden at 7:24.",
      senderEmail,
      receiverEmail,
      "timestamp": "2023-11-06T03:22:57.632Z",
      "__v": 0
    },
    // Add more mock data as needed
  ];

  module.exports = {
    getChatHistory: () => mockChatHistory,
  };
