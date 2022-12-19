// attention game support vectors
const color_att = ["red","blue","orange","green","yellow","pink","white","purple","brown","gray"];
const city_att = ["Seattle", "Dallas", "Denver","Detroit","Miami","Atlanta","Chicago","Portland","Boston","Philadelphia"];
const animal_att = ["dog","cat","elephant","snake","lion","mouse","tiger","pig","cow","sheep"];
const profession_att = ["doctor","lawyer","professor","engineer","farmer","plumber","politician","actor","chef","nurse"];
const sport_att = ["basketball","football","skating","rugby","volleyball","tennis","baseball","hockey","soccer","boxing"];

const question_orientation =    ['What year is it?']
function start (handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
            sessionAttributes.classification_state = "ATTENTION";
            const speakOutput = ` <amazon:emotion name="excited" intensity="medium">  Thank you ${sessionAttributes.NameProfile}! </amazon:emotion> <amazon:domain name="conversational"> Now we can start with classification in order to know your level of attention, orientation and memory. </amazon:domain>` +  '      ';
            const random_att = [color_att[Math.floor(Math.random()*color_att.length)],city_att[Math.floor(Math.random()*city_att.length)],animal_att[Math.floor(Math.random()*animal_att.length)],profession_att[Math.floor(Math.random()*profession_att.length)],sport_att[Math.floor(Math.random()*sport_att.length)]];
            sessionAttributes.random_vect_att = random_att;
            let string_att = " ";
                for (let value of random_att) {
                    string_att = string_att + value + ". ";
                }
            sessionAttributes.string_att = string_att;
            sessionAttributes.score_attention = 0;
            sessionAttributes.first_time_flag = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes)
            const speakOutput1 =' <amazon:domain name="conversational"> <break time="0.5s"/>  Lets start with the attention part. I will tell you 5 words, try to remember them. </amazon:domain> ';
            const speakOutput2 = ' <break time="0.5s"/> The words are: <break time="0.5s"/> ' +  ` <prosody rate="slow">  ${string_att}  </prosody>` ;
    return {speakOutput, speakOutput1, speakOutput2};
}

function check(handlerInput, user_slot) {
    
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const check_vector = sessionAttributes.random_vect_att;
    sessionAttributes.slots = user_slot;
    for (let word of check_vector) {   
        for (let user_word of user_slot) {
            if (word === user_word){ sessionAttributes.score_attention = sessionAttributes.score_attention+1; }
        }
    }
    
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);   
}

function newGame (handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
        sessionAttributes.classification_state = "ORIENTATION";
        const speakOutput = ` <amazon:domain name="conversational">  <amazon:emotion name="excited"> Good job! </amazon:emotion> Your score in Attention is ${sessionAttributes.score_attention}. <break time="0.5s"/>  <amazon:emotion name="excited" intensity="medium"> Remember, stay focused! </amazon:emotion> </amazon:domain>`;
        sessionAttributes.counter_orientation = 0;
        sessionAttributes.score_orientation = 0;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        const speakOutput1 = '<break time="1s"/> <amazon:domain name="conversational"> We will start orientation part. <prosody rate="medium"> Your 1st question is: <break time="0.5s"/>  </prosody> </amazon:domain>' + ` <amazon:domain name="conversational"> <prosody rate="slow"> ${question_orientation[sessionAttributes.counter_orientation]} </prosody> </amazon:domain>  `;
    
    return {speakOutput, speakOutput1};
}

module.exports = {check, start, newGame}