const color_mem =["pink","white","purple","brown","gray","red","blue","orange","green","yellow"]
const city_mem = ["Seattle", "Dallas", "Denver","Detroit","Miami","Atlanta","Chicago","Portland","Boston","Filadelfia"]
const animal_mem = ["mouse","tiger","pig","cow","sheep","dog","cat","elephant","snake","lion"]
const profession_mem = ["plumber","politician","actor","chef","nurse","doctor","lawyer","professor","engineer","farmer"]
const sport_mem = ["tennis","baseball","hockey","soccer","boxing","basketball","football","skating","rugby","volleyball"]
const dates = ["December 25th", "July 4th", "October 31st", "May 1st", "February 14th", "December 31st", "March 8th"];
const datesname = ["christmas", "independence day", "halloween", "labour day", "valentine day", "new years eve", "women's day", 
                   "Xmas", "independence", "Allhallows Eve", "international workers'day", "valentine's day", "new year", "international women's day"];
//const datesname = ["christmas", "thanksgiving day", "independence day", "halloween", "labour day", "memorial day", "new years eve"];
const question_dates = ['What anniversary occurs on the day:  ', 
                        'Okay! Try this one. What anniversary occurs on the day:   ',
                         'The last one. What anniversary occurs on the day:   '];
                         
 function confronto(slot, value)
 
 {
     
    const position = Number(value)  +  Number(7);
    if (slot !== undefined)
         if (slot.toString().toLowerCase() === datesname[value].toString().toLowerCase())
           return true;
           
    if(position <= 13)
    {
    if (slot !== undefined)
         if (slot.toString().toLowerCase() === datesname[position].toString().toLowerCase())
           return true;
    }
           
           
 }
 
function check(handlerInput,festivity) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const isCorrect = confronto(festivity , sessionAttributes.indicedata)
             if (isCorrect) {  sessionAttributes.score_dates +=1;  }
        sessionAttributes.count_dates +=1
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}

function newGame (handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
            const speakOutput = `${sessionAttributes.score_dates}. `+ 'The game is finished. <break time="1s"/> Next part is about memory.';
            sessionAttributes.game_state = "MEMORY";
            const random_mem = [color_mem[Math.floor(Math.random()*color_mem.length)],city_mem[Math.floor(Math.random()*city_mem.length)],animal_mem[Math.floor(Math.random()*animal_mem.length)],profession_mem[Math.floor(Math.random()*profession_mem.length)],sport_mem[Math.floor(Math.random()*sport_mem.length)]];
            sessionAttributes.flag_30_min = 1;
            
            let string_mem = " ";
                for (let value of random_mem) {
                    string_mem = string_mem + value + ". ";
                }
            sessionAttributes.random_vect_mem = string_mem;  
            sessionAttributes.score_memory_training = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
        const speakOutput1 =' I will tell you 5 words, <break time="1s"/>  try to remember them. ';
            const speakOutput2 = ' The words are: <break time="1s"/> ' + string_mem;
            const speakOutput3 = ' I will set a reminder for you in 30 minutes. <break time="1s"/> Come back and say these words to me';
    return {speakOutput, speakOutput1, speakOutput2, speakOutput3};
}

function newQuestion (handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes()|| {};
            const old_indice = sessionAttributes.indicedata;
            sessionAttributes.indicedata = [Math.floor(Math.random()*dates.length)];
            for (let i = 0; i<3; i++) {
            if (sessionAttributes.indicedata === old_indice) {
                sessionAttributes.indicedata = [Math.floor(Math.random()*dates.length)];
            }
            }
            
            const randomdate = dates[sessionAttributes.indicedata];
            sessionAttributes.date_word = randomdate;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            const speakOutput1 =`${sessionAttributes.score_dates}. `+ question_dates[sessionAttributes.count_dates] + " " + randomdate; 
    return speakOutput1;
}


module.exports = {check, newGame, newQuestion}