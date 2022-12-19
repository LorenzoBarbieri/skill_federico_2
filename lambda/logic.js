const moment = require("moment-timezone");

module.exports = {

    createReminder(currentDateTime, timezone, message){
        //Create reminder object
        const reminderRequest = {
            requestTime: currentDateTime.format('YYYY-MM-DDTHH:mm:ss'),
            trigger: {
                type: 'SCHEDULED_ABSOLUTE',
                scheduledTime: currentDateTime.add(30, 'seconds').format('YYYY-MM-DDTHH:mm:00.000'), //This sets the reminder 5 minutes in the future
                timeZoneId: timezone
            },
            alertInfo: {
                spokenInfo: {
                    content: [{
                        locale: 'en-US',
                        text: message
                    }]
                }
            },
            pushNotification: {
                status: 'ENABLED'
            }
        }
        
        return reminderRequest;
    }
}

