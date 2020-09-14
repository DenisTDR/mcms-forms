import { FormlyFieldConfig } from '@ngx-formly/core';

// solution stolen from https://stackoverflow.com/a/47445458
function safeEvalFormlyExpression(expression: string, field: FormlyFieldConfig): any {
  expression = ' \n\n\n\n return ' + expression + ';';
  const safeMcmsFns = (window as any).safeMcmsFns || (window.parent as any).safeMcmsFns;
  const safeArguments = {field, model: field.model, formState: field.options.formState, safeMcmsFns};
  const safeArgumentsNames = Object.keys(safeArguments);
  const globalNames = Object.keys(window);
  const allArgumentNames = safeArgumentsNames.concat(globalNames);

  const safeArgumentsValues = allArgumentNames.map((key) => {
    return safeArguments[key];
  });
  const evalFn = Function.apply(null, allArgumentNames.concat([expression]));
  const result = evalFn.apply({}, safeArgumentsValues);
  console.log('result: ' + result);
  return result;
}

(window as any).safeEvalFormlyExpression = safeEvalFormlyExpression;

export default safeEvalFormlyExpression;
