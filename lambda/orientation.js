const moment = require('moment');
const momenttz = require('moment-timezone');
const now = momenttz.utc();
const ISO = require('./ISO_country.js');
const color_mem =["pink","white","purple","brown","gray","red","blue","orange","green","yellow"]
const city_mem = ["Seattle", "Dallas", "Denver","Detroit","Miami","Atlanta","Chicago","Portland","Boston","Filadelfia"]
const animal_mem = ["mouse","tiger","pig","cow","sheep","dog","cat","elephant","snake","frog"]
const profession_mem = ["plumber","politician","actor","chef","nurse","doctor","lawyer","professor","engineer","farmer"]
const sport_mem = ["tennis","baseball","hockey","soccer","boxing","basketball","football","skating","rugby","volleyball"]
const question_orientation =    ['What year is it?', 
                                'This is the 2nd question: <break time="0.5s"/> What month is it ?', 
                                'This is the 3rd question: <break time="0.5s"/> What day of week is it?',
                                'This is the 4th question: <break time="0.5s"/> What is todays day number?',
                                'This is the 5th question: <break time="0.5s"/> Now tell me what time is it?',
                                'This is the 6th question: <break time="0.5s"/> Which city do you live in?',
                                'This is the 7th question: <break time="0.5s"/> What country do you live in?'];
                                
const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable Location permissions in the Amazon Alexa app.',
  NOTIFY_MISSING_PERMISSIONS_NAME: 'Please enable name permissions in the Amazon Alexa app.',
  NO_ADDRESS: 'It looks like you don\'t have an address set. You can set your address from the companion app.',
  NO_NAME: 'It looks like you don\'t have an name set. You can set your address from the companion app.',
  ERROR: 'There was an error with the Device Address API. Please check the logs.',
  LOCATION_FAILURE: 'There was an error with the Device Address API. Please try again.',
  EXITSKILLMESSAGE: 'Goodbye! See you soon.',
  DESCRIPTION: 'You need this test in order to improve your sense of direction. What do you like to do?',
};

function compareSlots(slots, value) {
  for (const slot in slots) {
    if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
      if (slots[slot].value.toString().toLowerCase() === value.toString().toLowerCase()) {
        return true;
      }
    }
  }
}

function getCountryName (countryCode) {
    if (ISO.isoCountries.hasOwnProperty(countryCode)) {
        return ISO.isoCountries[countryCode];
    } else {
        return countryCode;
    }
}

function newQuestion1(handlerInput, slots) {
        const {attributesManager} = handlerInput;
        const attributes =  attributesManager.getSessionAttributes();
        let speakOutput;
            if (attributes.counter_orientation === 0) //year
            attributes.answer = moment().year();
            if (attributes.counter_orientation === 1) //month 
            attributes.answer = now.format('MMMM');
            if (attributes.counter_orientation === 2) //day of the week
            attributes.answer = now.format('dddd');
            if (attributes.counter_orientation === 3)//number day of the month
            attributes.answer = moment().date();
        
        const isCorrect = compareSlots(slots, attributes.answer);
        if (isCorrect) {  attributes.score_orientation += 1;  }
        attributes.counter_orientation += 1;
        handlerInput.attributesManager.setSessionAttributes(attributes);
        
        if (attributes.counter_orientation < 4) {
             speakOutput = `${attributes.score_orientation}. `+ ' ' + question_orientation[attributes.counter_orientation];
        }
        else {
            speakOutput = `${attributes.score_orientation}. `+' ' + `<amazon:domain name="conversational"> ${question_orientation[attributes.counter_orientation]} </amazon:domain>`;
            attributes.classification_state = "ORIENTATION_2";
            handlerInput.attributesManager.setSessionAttributes(attributes);
        }
        return speakOutput;
}

function timeCheck (handlerInput,time_user, usertimeZone) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let isCorrect = false;
    if (time_user.value !== undefined)
    {
    //const minutes_current = Number(now.tz(usertimeZone).format('mm'));
    const hours_current = Number(now.tz(usertimeZone).format('HH'));
    const time_user_vect = time_user.value.split(":");
    const hours_user = Number(time_user_vect[0]);
    //const minutes_user = Number(time_user_vect[1]);
    
    if ( (hours_user === hours_current) || (hours_user>hours_current && hours_user<=hours_current+1) || (hours_user<hours_current && hours_user>=hours_current-1) ) {
        isCorrect = true;
    }

    if (isCorrect) { attributes.score_orientation += 1; }
    }
    
    attributes.counter_orientation += 1;
    attributes.classification_state = "ORIENTATION_3";
    handlerInput.attributesManager.setSessionAttributes(attributes);
    const speakOutput = `${attributes.score_orientation}. `+' ' + question_orientation[attributes.counter_orientation];
    return speakOutput;
}

function newQuestion2 (handlerInput, address, slots) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speakOutput, speakOutput1 = " ", speakOutput2 = " ", speakOutput3 = " ";
            if (attributes.counter_orientation === 5) {   attributes.answer = address.stateOrRegion;   }
            if (attributes.counter_orientation === 6) {   attributes.answer = getCountryName(address.countryCode);  }
            //if (attributes.counter_orientation === 7) {   attributes.answer = address.postalCode;     }

             const isCorrect = compareSlots(slots, attributes.answer);
             if (isCorrect) { attributes.score_orientation += 1; }
             attributes.counter_orientation += 1;
             handlerInput.attributesManager.setSessionAttributes(attributes);
             if (attributes.counter_orientation <7) {
             speakOutput = `${attributes.score_orientation}. `+' ' + question_orientation[attributes.counter_orientation];
             return {speakOutput, speakOutput1, speakOutput2, speakOutput3};
             }
             else {
                 const speakOutput = `${attributes.score_orientation}. `+ '<amazon:emotion name="excited" intensity="medium">Great! <break time="1s"/> The orientation game is finished. Next part is about memory.</amazon:emotion>';
            attributes.classification_state = "MEMORY";
            const random_mem = [color_mem[Math.floor(Math.random()*color_mem.length)],city_mem[Math.floor(Math.random()*city_mem.length)],animal_mem[Math.floor(Math.random()*animal_mem.length)],profession_mem[Math.floor(Math.random()*profession_mem.length)],sport_mem[Math.floor(Math.random()*sport_mem.length)]];
            attributes.flag_30_min = 1;
            
            let string_mem = " ";
                for (let value of random_mem) {
                    string_mem = string_mem + value + ". ";
                }
            attributes.random_vect_mem = string_mem; 
            attributes.score_memory_classification = 0;
            handlerInput.attributesManager.setSessionAttributes(attributes); 
            speakOutput1 =' <break time="0.5s"/> <amazon:domain name="conversational"> I will tell you 5 words, <break time="1s"/> try to remember them. </amazon:domain> ';
            speakOutput2 = ' The words are: <break time="1s"/> ' + string_mem;
            speakOutput3 = ' I will set a reminder for you in 30 minutes. <break time="1s"/> Come back and say these words to me' ;
            return {speakOutput, speakOutput1, speakOutput2, speakOutput3};
             }
            
             
}


module.exports = {newQuestion1, timeCheck, newQuestion2}

