document.addEventListener('DOMContentLoaded', () => {

  const mainDisplay = new Display('#main-display', '0');
  mainDisplay.update = function(value) {
    const display = this.htmlElement;

    if (value.length > 16) {
      display.textContent = 'Error';
      return;
    }

    if (display.textContent === '0' || display.textContent === 'Error') {
      display.textContent = value;
      return;
    }

    if (display.textContent === '-0') {
      display.textContent = '-' + value;
      return;
    }
    
    if (value === '.' && display.textContent.includes('.')) return;
  
    const nextValue = display.textContent + value;
  
    if (nextValue.length <= 16) {
      display.textContent += value;
    } 
  }

  mainDisplay.changeSymbol = function() {
    const display = this.htmlElement;

    if (display.textContent === 'Error') return;

    if (display.textContent.includes('-')) {
      display.textContent = display.textContent.replace('-', '');
    } else {
      display.textContent = '-' + display.textContent;
    }
  }

  mainDisplay.delete = function() {
    const display = this.htmlElement;
    let nextValue = display.textContent.slice(0, -1);

    if (nextValue.slice(-1) === '.') {
      nextValue = nextValue.replace('.', '');
    }
    
    if (/^-?\d+(\.\d+)?$/.test(nextValue)) {
      display.textContent = nextValue;
    } else {
      this.reset();
    }
  }

  const memoryDisplay = new Display('#memory-display', '');
  memoryDisplay.update = function(value) {
    this.htmlElement.textContent += (this.htmlElement.textContent === '')
      ? value
      : ' ' + value;
  }

  const calculator = new Calculator();

  document.querySelectorAll('[data-operand]').forEach(btn => {
    btn.addEventListener('click', event => {
      mainDisplay.update(event.currentTarget.textContent);
    });
  });

  document.querySelector('[data-change]').addEventListener('click', () => {
    mainDisplay.changeSymbol();
  });

  document.querySelector('[data-delete]').addEventListener('click', () => {
    mainDisplay.delete();
  });

  document.querySelector('[data-clear]').addEventListener('click', () => {
    calculator.reset();
    mainDisplay.reset();
    memoryDisplay.reset();
  });

  document.querySelectorAll('[data-operator]').forEach(btn => {
    btn.addEventListener('click', event => {
      if (calculator.memory.previousOperand !== undefined) {
        const result = calculator.operate(
          calculator.memory.previousOperand,
          calculator.memory.operator,
          Number(mainDisplay.htmlElement.textContent)
        );

        calculator.memory.previousOperand = result;
        calculator.memory.operator = event.currentTarget.textContent

      } else {

        if (/[^\d.-]/g.test(mainDisplay.htmlElement.textContent)) return;
        calculator.memory.previousOperand = mainDisplay.htmlElement.textContent;
        calculator.memory.operator = event.currentTarget.textContent;
      }

      memoryDisplay.reset();
      memoryDisplay.update(calculator.memory.previousOperand);
      memoryDisplay.update(calculator.memory.operator);
      mainDisplay.reset();
    });
  });

  document.querySelector('[data-equals]').addEventListener('click', event => {
    if (calculator.memory.previousOperand !== undefined) {
      const result = calculator.operate(
        calculator.memory.previousOperand,
        calculator.memory.operator,
        Number(mainDisplay.htmlElement.textContent)
      );

      memoryDisplay.update(mainDisplay.htmlElement.textContent);
      mainDisplay.reset();
      mainDisplay.update(String(result));
      calculator.reset();
    }
  });
});

function Display(selector, resetValue) {
  this.htmlElement = document.querySelector(selector);
  this.reset = () => { this.htmlElement.textContent = resetValue };
}

function Calculator() {
  this.memory = new Memory();
  this.reset = function() {
    this.memory = new Memory();
  }

  this.operations = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '×': (a, b) => a * b,
    '÷': (a, b) => a / b,
  }

  this.operate = function(operand1, operator, operand2) {
    return this.operations[operator](operand1, operand2);
  }
}

function Memory() {
  this._previousOperand = undefined;
  this._operator = undefined;

  Object.defineProperty(this, 'previousOperand', {
    get: function() {
      return this._previousOperand;
    },
    set: function(value) {
      this._previousOperand = Math.round(Number(value) * 1000) / 1000;
    }
  });

  Object.defineProperty(this, 'operator', {
    get: function() {
      return this._operator;
    },
    set: function(value) {
      this._operator = value;
    }
  });
}
