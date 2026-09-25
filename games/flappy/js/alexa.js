let alexaVersion = '1.0';
let alexa;

const success = function(result) {
	// const {alexa, message} = result;
	// Actions after Alexa client initialization is complete
	// debugMe("LOADED");
	// useBgAudio = setAudioStatus(result.message.context);
	// showIntro();
	// initialiseGameBoards(result.message);




	startGame(result)



	alexa = result.alexa;
	alexa.speech.onStarted(speechStarted);
	alexa.speech.onStopped(speechStopped);
	alexa.skill.onMessage(skillOnMessage);
	alexa.skill.sendMessage(skillSendMessage);
	alexa.voice.onMicrophoneOpened(micOnOpened);
	alexa.voice.onMicrophoneClosed(micOnClosed);

	// NOT NEEDED
	// alexa.performance.getMemoryInfo().then((memoryInfo) => {
	// 	const minimumRequiredMemoryAtStart = 400;
	// 	const {availableMemoryInMB} = memoryInfo;
	// 	if (availableMemoryInMB <= minimumRequiredMemoryAtStart) { // Gracefully exit game, device unsupported
	// 		console.log("MEMORY CHECK - Gracefully exit game, device unsupported")
	// 	} else {
	// 		console.log("MEMORY CHECK - Continue with game")
	// 	}
	// }).catch((error) => {
	// 	const {message} = error;
	// 	console.log('Failed to retrieve memory. ' + message);
	// });
	// alexa.performance.getMemoryInfo();
	
	console.log(alexa)

	try {
		// document.getElementById('micOpen').addEventListener('click', () => micOnOpened());
		// document.getElementById('micClose').addEventListener('click', () => micOnClosed());
		// document.getElementById('toggleAudio').addEventListener('click', () => toggleAudio());
	} catch {}
};

const failure = function(error) {
	const {code, message} = error; // Actions for failure to initialize
	console.log(error)
};
try {
	if (window.alexaHtmlLocalDebug) { // both alexaHtmlLocalDebug and LocalMessageProvider are injected into the page by alexa-html-local
	  	Alexa.create({ version: alexaVersion, messageProvider: new LocalMessageProvider() }).then(success).catch(failure);
	} else {
		Alexa.create({ version: alexaVersion }).then(success).catch(failure);
	}
} catch (err) {
	console.log("Alexa Load Error", err)
}
