class DeathWheel {
  constructor() {
    this.fieldTypes = ['red', 'green', 'bonus'];
  }
  
  spin(wheelState) {
    const totalFields = wheelState.redFields + wheelState.greenFields + wheelState.bonusFields;
    const randomIndex = Math.floor(Math.random() * totalFields);
    
    if (randomIndex < wheelState.redFields) {
      return 'death';
    } else if (randomIndex < wheelState.redFields + wheelState.greenFields) {
      return 'safe';
    } else {
      return 'bonus';
    }
  }
  
  getFieldDistribution(wheelState) {
    return {
      red: wheelState.redFields,
      green: wheelState.greenFields,
      bonus: wheelState.bonusFields,
      total: wheelState.redFields + wheelState.greenFields + wheelState.bonusFields
    };
  }
}

module.exports = DeathWheel;