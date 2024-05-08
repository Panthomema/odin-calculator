document.addEventListener('DOMContentLoaded', () => {

  const calculator = new Calculator(12);
  const mainDisplay = new Display('#main-display', '0');
  const memoryDisplay = new Display('#memory-display', '');

  // Inputs user selected number to the display

  mainDisplay.addNumber = function(num) {
    const display = this.htmlElement;

    if (/[^\d.-]/g.test(display.textContent)) {
      display.textContent = num;
      memoryDisplay.reset();
      return;
    }

    if (display.textContent === '0') {
      display.textContent = num;
      return;
    }

    if (display.textContent === '-0') {
      display.textContent = '-' + num;
      return;
    }

    const nextContent = display.textContent + num;
  
    if (nextContent.length <= calculator.maxDigits) {
      display.textContent = nextContent;
    } 
  }

  // Inputs user selected floating point to the display

  mainDisplay.addPoint = function() {
    const display = this.htmlElement;

    if (display.textContent.includes('.')) return;

    if (/[^\d.-]/g.test(display.textContent)) {
      display.textContent = 0;
      memoryDisplay.reset();
    }

    display.textContent += '.';
  }

  // Replaces the content (for showing the result)

  mainDisplay.update = function(value) {
    this.htmlElement.textContent = value;
  }

  // Changes display content sign

  mainDisplay.changeSign = function() {
    const display = this.htmlElement;

    if (/[^\d.-]/g.test(display.textContent)) return;

    if (display.textContent.includes('-')) {
      display.textContent = display.textContent.replace('-', '');
    } else {
      display.textContent = '-' + display.textContent;
    }
  }

  // Deletes last digit from content

  mainDisplay.delete = function() {
    const display = this.htmlElement;
    let nextContent = display.textContent.slice(0, -1);

    if (nextContent.slice(-1) === '.') {
      nextContent = nextContent.replace('.', '');
    }

    if (/^-?\d+(\.\d+)?$/.test(nextContent)) {
      display.textContent = nextContent;
    } else {
      this.reset();
    }

    if (/[^\d.-]/g.test(nextContent)) {
      memoryDisplay.reset();
    }
  }

  // Shows error message

  mainDisplay.error = function() {
    this.htmlElement.textContent = 'Error';
  }

  // Updates the content 

  memoryDisplay.update = function(value) {
    this.htmlElement.textContent += (this.htmlElement.textContent === '')
      ? value
      : ' ' + value;
  }

  // Shows error message

  memoryDisplay.error = function(message) {
    this.htmlElement.textContent = message;
  }

  // Adding listeners

  document.querySelectorAll('[data-number]').forEach(btn => {
    btn.addEventListener('click', event => {
      mainDisplay.addNumber(event.currentTarget.textContent);
    });
  });

  document.querySelector('[data-point]').addEventListener('click', () => {
    mainDisplay.addPoint();
  });

  document.querySelector('[data-change]').addEventListener('click', () => {
    mainDisplay.changeSign();
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
      try {
        /* 
          Assign actual operand to memory and wait next operand
          If we had a qeued operation (were waiting for 2nd operand),
          resolves it and queues new operation
        */
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

      } catch(error) {
        mainDisplay.error();
        memoryDisplay.error(error.message);
        calculator.reset();
      }
    });
  });

  document.querySelector('[data-equals]').addEventListener('click', event => {
    
    // Resolve operation only if we have a qeued one

    if (calculator.memory.previousOperand !== undefined) {
      try {
        const result = calculator.operate(
          calculator.memory.previousOperand,
          calculator.memory.operator,
          Number(mainDisplay.htmlElement.textContent)
        );
  
        memoryDisplay.update(mainDisplay.htmlElement.textContent);
        mainDisplay.reset();
        mainDisplay.update(result);
        calculator.reset();

      } catch (error) {
        mainDisplay.error();
        memoryDisplay.error(error.message);
        calculator.reset();
      }
    }
  });
});

function Display(selector, resetValue) {
  this.htmlElement = document.querySelector(selector);
  this.reset = () => { this.htmlElement.textContent = resetValue };
}

function Calculator(maxDigits) {
  this.maxDigits = maxDigits;
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
    let result = this.operations[operator](operand1, operand2);

    if (result === Infinity) throw new Error('Division by zero');
    
    if (String(result).length > this.maxDigits) {
      if (Number.isInteger(result)) {
        throw new Error(`Max digits (${this.maxDigits}) exceeded`);
      }
      
      const integerPart = String(result).split('.')[0] + '.';
      const availableSpace = this.maxDigits - integerPart.length;

      if (availableSpace < 1) {
        throw new Error(`Max digits (${this.maxDigits}) exceeded`);
      }

      result = Number(result.toFixed(availableSpace));
    }

    return result;
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
      this._previousOperand = Number(value);
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
