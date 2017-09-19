/*
  100buttons.ino

  100 Button controller firmware.

  Well, you might need two of these to get to 100. Originally implemented on two
  (2) Elegoo Mega 2560 Arduino clones.

  Code swiped from, and belongs to Amanda:
  https://itch.io/jam/100-button-game-jam/topic/140791/code-code-for-the-arduino

*/
#define INPUT_COUNT 54

byte buttonstates[9];

void setup() {
  Serial.begin(9600);
  buttonstates[8] = 1;
  for(int i = 0; i < INPUT_COUNT; i++){
    pinMode(i, INPUT_PULLUP);
  }
}

void loop() {
  for(int i = 0; i < 8; i++){
    buttonstates[i] = 0;
  }
  for(int i = 0; i < INPUT_COUNT; i++){
    if(digitalRead(i) != HIGH){
      buttonstates[i / 7] |= 1 << (i % 7 + 1);
      //Serial.println(i);
    }
  }
  Serial.write(buttonstates, 9);
  delay(20);
}
