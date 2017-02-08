// Simple template engine Class
/**
 * Template engind initialize
 * @param   {String} templateId  the id attribute of template script element
 * @return  {Function} render function
 */
function TemplateEngine(templateId) {
  var template = document.getElementById(templateId).innerHTML;
  var templateParsed = ['var $out = [];\nwith ($data) {'];

  template.split('\n').forEach(function (line) {
    var parsed;

    line = line.trim();

    if (/<%=/.test(line)) {
      // parse data output
      templateParsed.push('$out.push(\'' + line.replace(/<%= ?([a-z\(\)\.\[\]_]*) ?%>/gi, '\' + $1 + \'') + '\');');
    } else if (/<% ?for ?\(/.test(line)) {
      // parse for iteration
      templateParsed.push(line.replace(/<% ?(for ?\(.*\) ?{) ?%>/gi, '$1'));
    } else if (/^<% ?} ?%>$/.test(line)) {
      templateParsed.push('}');
    } else if (!/^[\s\n]*$/.test(line)) {
      templateParsed.push('$out.push(\'' + line + '\');');
    }
  });

  templateParsed.push('}\nreturn $out.join(\'\')');

  document.getElementById(templateId).remove();

  return function (data) {
    return new Function('$data', templateParsed.join(''))(data);
  };
}
