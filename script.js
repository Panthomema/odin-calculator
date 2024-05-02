const SUPPORTED_OPERATIONS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
}

document.addEventListener('DOMContentLoaded', () => {
  const inputBtns = document.querySelectorAll('button:not(.btn-control)');
  console.log(inputBtns);
});

function operate(operand1, operator, operand2) {
  return SUPPORTED_OPERATIONS[operator](operand1, operand2);
}