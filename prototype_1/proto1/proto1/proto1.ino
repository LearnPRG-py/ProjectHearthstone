// ASL Glove - 3 Flex Sensors (Thumb, Index, Middle)
// Letters recognized: A, B, L, F, D, M

const int numSensors = 3;
int pins[numSensors] = {A3, A2, A1};     // Thumb, Index, Middle
int straight[numSensors];
int bent[numSensors];
int readings[numSensors];
bool states[numSensors];                 // 0 = straight, 1 = bent
int lastStates[numSensors];              // For hysteresis

void setup() {
  Serial.begin(9600);
  delay(1000);
  Serial.println("\n=== ASL Glove Calibration ===");
  Serial.println("Keep all fingers STRAIGHT...");
  delay(3000);

  for (int i = 0; i < numSensors; i++) {
    straight[i] = analogRead(pins[i]);
  }

  Serial.println("Now bend all fingers FULLY...");
  delay(3000);

  for (int i = 0; i < numSensors; i++) {
    bent[i] = analogRead(pins[i]);
    lastStates[i] = 0;
  }

  Serial.println("\nCalibration complete!");
  Serial.println("Start signing...\n");
}

void loop() {
  for (int i = 0; i < numSensors; i++) {
    readings[i] = analogRead(pins[i]);

    int diff = abs(bent[i] - straight[i]);
    int threshold = (straight[i] + bent[i]) / 2;

    // Finger-specific calibration tweaks
    if (i == 0) {
      // Thumb – wide range, make slightly forgiving
      threshold -= diff * 0.05;
    } 
    else if (i == 1) {
      // Index – slightly less sensitive
      threshold += diff * 0.2;
    } 
    else if (i == 2) {
      // Middle – make it easier to count as bent (more lenient)
      threshold -= diff * 0.35; // was 0.25, now more lenient
    }

    // Add hysteresis (to prevent flickering near threshold)
    int buffer = diff * 0.05; // 5% buffer
    if (readings[i] > threshold + buffer) states[i] = 1;  // bent
    else if (readings[i] < threshold - buffer) states[i] = 0; // straight
    else states[i] = lastStates[i]; // keep last state if within buffer

    lastStates[i] = states[i];
  }

  char letter = detectLetter(states[0], states[1], states[2]);
  if (letter != '-') {
    Serial.print("Detected: ");
    Serial.println(letter);
    delay(400);
  }
}

// Function to classify based on states (thumb, index, middle)
char detectLetter(bool thumb, bool index, bool middle) {
  if (thumb && !index && !middle) return 'A';  // Thumb straight, others bent
  if (!thumb && index && middle) return 'B';   // Thumb bent, others straight
  if (thumb && index && !middle) return 'L';   // Thumb & index straight, middle bent
  if (!thumb && !index && middle) return 'F';  // Thumb & index bent, middle straight
  if (!thumb && index && !middle) return 'D';  // Thumb + middle bent, index straight
  if (!thumb && !index && !middle) return 'M'; // All bent
  return '-';
}
