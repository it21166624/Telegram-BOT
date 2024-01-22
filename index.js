const TelegramBot = require('node-telegram-bot-api');
const XLSX = require('xlsx');
const fs = require('fs');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token you received from BotFather
const botToken = '6535068755:AAGlDM6THWBzUPuyodUVp5B0ly3ACy3BMOs';

// Create a new bot instance
const bot = new TelegramBot(botToken, { polling: true });

// Function to convert Excel date and time to JavaScript Date object
function excelDateTimeToDate(excelDate, excelTime) {
  const daysSince1900 = excelDate - 1; // Excel incorrectly assumes 1900 is a leap year
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const excelTimeInMilliseconds = excelTime * millisecondsPerDay;
  console.log(excelTimeInMilliseconds)
  const day = new Date(excelTimeInMilliseconds + (daysSince1900 * millisecondsPerDay))
  console.log(day)
  
  return new Date(Date.UTC(1900, 0, daysSince1900, 0, 0, 0) + excelTimeInMilliseconds);
}

// Function to read the Agenda.xlsx file and convert rows to JSON
function readExcelToJson() {
  const workbook = XLSX.readFile('Agenda.xlsx');
  const sheetName = workbook.SheetNames[1];
  const worksheet = workbook.Sheets[sheetName];
  

  const data = XLSX.utils.sheet_to_json(worksheet, { raw: true });

  // Process each row and convert date and time fields to JavaScript Date objects
  const processedData = data.map((item) => {
    
    const eventDate = excelDateTimeToDate(item['Date'], item['Time']);
    console.log(item['Date'] + " "+ item['Time'])
    return {
    
      Date: eventDate,

      Description: item['Description'],

    };
  });

  return processedData;
}

// Global variables to manage the conversation state
const state = {};
const jsonData = readExcelToJson();
console.log(jsonData)
// Listen for incoming messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Print the incoming message in the console
  console.log(`Received message from ${msg.from.username} (${chatId}): ${messageText}`);

  if (!state[chatId]) {
    // If the user is new or has completed the conversation
    state[chatId] = {
      step: 'prompt',
      userData: {},
    };

    bot.sendMessage(chatId, 'Hi there! Do you want to ragister for event notifications? yes/no');
  } else {
    // Handle the user input based on the conversation step
    const currentState = state[chatId];
    switch (currentState.step) {
      case 'username':
        currentState.userData.UserName = messageText.trim();
        currentState.step = 'serviceno';
        bot.sendMessage(chatId, 'Great! Now, please enter your service number:');
        break;

      case 'prompt':
        const answer = messageText.trim();
        //const matchingUser = jsonData.find((user) => user.UserName === currentState.userData.UserName && user.ServiceNo === currentState.userData.ServiceNo);
        if (answer.toLocaleLowerCase()==='yes') {
          // User found in the JSON data, schedule the reminder
          jsonData.map(
            (event)=>{
              const eventDate = event.Date
              const now = new Date();
        console.log('eeeeeeeeeeee')
            console.log(eventDate)
            const current = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                now.getHours(),
                now.getMinutes()
              );
            console.log(now)
            //current = current.getTime()+(31449 *1000)
            console.log(current)
            const adDte = new Date(current.getTime()+(((5*60)+30)*60*1000))
            console.log(adDte)
           
          if (eventDate > adDte) {
            
            const timeDifference = eventDate.getTime() - adDte.getTime();
            
            setTimeout(() => {
                
              bot.sendMessage(chatId, `Hi ! It's time for "${event.Description}".`);
            }, timeDifference);
          }
            }
          )
          const eventDate = matchingUser.Date;       
        } else {
          // User not found in the JSON data
          bot.sendMessage(chatId, 'Sorry, we could not find a matching record. Please try again.');
        }

        // Reset the state after completing the conversation
        delete state[chatId];
        break;

      default:
        // Invalid conversation step, reset the state
        delete state[chatId];
        bot.sendMessage(chatId, 'Oops! Something went wrong. Please start again.');
        break;
    }
  }
});

console.log('Bot is running...');
