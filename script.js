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

  const numberBtns = Array.from(document.querySelectorAll('[data-number]'));
  const pointBtn = document.querySelector('[data-point]');
  const changeBtn = document.querySelector('[data-change]');
  const deleteBtn = document.querySelector('[data-delete]');
  const clearBtn = document.querySelector('[data-clear]');
  const operatorBtns = Array.from(document.querySelectorAll('[data-operator]'));
  const equalsBtn = document.querySelector('[data-equals]');


  numberBtns.forEach(btn => {
    btn.addEventListener('click', event => {
      mainDisplay.addNumber(event.currentTarget.textContent);
    });
  });

  pointBtn.addEventListener('click', () => {
    mainDisplay.addPoint();
  });

  changeBtn.addEventListener('click', () => {
    mainDisplay.changeSign();
  });

  deleteBtn.addEventListener('click', () => {
    mainDisplay.delete();
  });

  clearBtn.addEventListener('click', () => {
    calculator.reset();
    mainDisplay.reset();
    memoryDisplay.reset();
  });

  operatorBtns.forEach(btn => {
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

  equalsBtn.addEventListener('click', event => {
    
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

  // Keyboard support

  document.addEventListener('keydown', event => {

    if (Number.isInteger(Number(event.key))) {
      const numberBtn = numberBtns.find(node => node.textContent === event.key);
      numberBtn.click();
      return;
    }

    const keyboardButtons = {
      '.': pointBtn,
      'Tab': changeBtn,
      'Backspace': deleteBtn,
      'Delete': clearBtn,
    }

    if (keyboardButtons[event.key]) {
      keyboardButtons[event.key].click();
      return;
    }

    /* 
      Map all of them to ensure 
      Probably this is not the best way cause it is kinda rendundant
    */

    const operatorTranslationMap = {
      '+': '+',
      '-': '-',
      '×': '×',
      '*': '×',
      '÷': '÷',
      '/': '÷',
    }

    if (operatorTranslationMap[event.key]) {
      const symbol = operatorTranslationMap[event.key];
      const operatorBtn = operatorBtns.find(node => node.textContent === symbol);
      operatorBtn.click();
      return;
    }

    if (event.key === '=' || event.key === 'Enter') {
      equalsBtn.click();
      return;
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
    if (operator === '÷' && operand2 === 0) throw new Error('Division by zero');

    let result = this.operations[operator](operand1, operand2);

    /*
      Ensure result is in the digit amount limits
      In case its a decimal number, round to the max available precision
      depending on the integer part length
    */
    
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
