function openImage (url,title,w,h,scroll) {
  if (scroll) {
    scroll = 'scrollbars=yes,resizable=yes';
  }
  else {
    scroll = 'scrollbars=no,resizable=no';
    h += 24;
  }
  var win = window.open('','_blank',
                        'width=' + w + ', height=' + h + ', '
                        + 'location=no,menubar=no,status=no,toolbar=no,'
                        + scroll);
  win.resizeTo(w,h);
  win.document.write('<html><head><title>'+title+'</title></head>'
                     + '<body topmargin=0 leftmargin=0 '
                     + 'marginheight=0 marginwidth=0 '
                     + 'style="background-color: #000">');
  win.document.write("<div style='background-color:#000;text-align:center;'>"
                     + "<img src='"+url+"' alt='"+title+"'></div>");
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
}

function openQuicktime (url,title,w,h,scroll) {
  if (scroll) {
    scroll = 'scrollbars=yes,resizable=yes';
  }
  else {
    scroll = 'scrollbars=no,resizable=no';
  }
  var wh = h + 10;
  var win = window.open('','_blank',
                        'width=' + w + ', height=' + wh + ', '
                        + 'location=no,menubar=no,status=no,toolbar=no,'
                        + scroll);
  // Figure out how much extra space the window adds around the content.
  chromeWidth = win.outerWidth - win.innerWidth;
  chromeHeight = win.outerHeight - win.innerHeight;
  // Figure out if the movie needs to be scaled down to fit on the screen.
  if (w + chromeWidth > win.screen.availWidth)
    xScale = (win.screen.availWidth - chromeWidth) / w;
  else
    xScale = 1.0;
  if (h + 16 + chromeHeight > win.screen.availHeight)
    yScale = (win.screen.availHeight - chromeHeight - 16) / h;
  else
    yScale = 1.0;
  scale = (xScale < yScale) ? xScale : yScale;
  w *= scale;
  h *= scale;

  // Finally resize the window to the optimal size.
  win.resizeTo(w + chromeWidth, h + 16 + chromeHeight);
       
  // Load the window content.
  // The body's onload function jiggles the size of the window after a
  // one second delay (which may need to be longer) to work around a bug in 
  // Firefox with QT < 7.6.5.  Otherwise you just get a white box.  Has no 
  // effect if the video showed up initially.
  win.document.write('<html><head><title>'+title+'</title></head>'
                     + "<body topmargin=0 leftmargin=0 "
                     + "marginheight=0 marginwidth=0 style='background-color:#000;' onload='setTimeout(\"window.resizeBy(-1, 0); window.resizeBy(1, 0);\",1000); return false;'>"
                     + "<div style='text-align:center;'>");
  win.document.write('<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" height='+h+' width='+w+' codebase="http://www.apple.com/qtactivex/qtplugin.cab">');
  win.document.write('<param name="src" value="'+url+'">');
  win.document.write('<param name="autoplay" value="true">');
  win.document.write('<param name="controller" value="true">');
  win.document.write('<param name="scale" value="Aspect">');
  win.document.write('<embed src="'+url+'" height='+h+' width='+w+' autoplay="true" controller="true" scale="Aspect" pluginspage="http://www.apple.com/quicktime/download/">');
  win.document.write('</embed></object></div></body></html>');
  win.document.close();
  win.focus();
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
function openQuicktime2 (url,title,w,h,scroll) {
  if (scroll) {
    scroll = 'scrollbars=yes,resizable=yes';
  }
  else {
    scroll = 'scrollbars=no,resizable=no';
    h += 60;
  }
  var win = window.open('','_blank',
                        'width=' + w + ', height=' + h + ', '
                        + 'location=no,menubar=no,status=no,toolbar=no,'
                        + scroll);
  win.resizeTo(w,h);
  win.document.write('<html><head><title>'+title+'</title></head>'
                     + '<body topmargin=0 leftmargin=0 '
                     + 'marginheight=0 marginwidth=0>'
                     + "<div style='background-color:#000;text-align:center;'>");
  win.document.write('<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" height='+h+' width='+w+' codebase="http://www.apple.com/qtactivex/qtplugin.cab">');
  win.document.write('<param name="src" value="'+url+'">');
  win.document.write('<param name="autoplay" value="true">');
  win.document.write('<param name="controller" value="true">');
  win.document.write('<param name="scale" value="Aspect">');
  win.document.write('<embed src="'+url+'" height='+h+' width='+w+' autoplay="true" controller="true" scale="Aspect" pluginspage="http://www.apple.com/quicktime/download/">');
  win.document.write('</embed></object></div></body></html>');
  win.document.close();
  win.focus();
}

function createCookie(name,value,days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    var expires = "; expires=" + date.toGMTString();
  }
  else expires = "";
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getActiveStyleSheet() {
var i, a;
 for (i=0; (a = document.getElementsByTagName("link")[i]); i++) {
  if (a.getAttribute("rel").indexOf("style") != -1
      && a.getAttribute("title")
      && !a.disabled) return a.getAttribute("title");
  }
  return null;
}

function getPreferredStyleSheet() {
  var i, a;
  for (i=0; (a = document.getElementsByTagName("link")[i]); i++) {
    if (a.getAttribute("rel").indexOf("style") != -1
        && a.getAttribute("rel").indexOf("alt") == -1
        && a.getAttribute("title")) return a.getAttribute("title");
  }
  return null;
}

function setActiveStyleSheet(title) {
  var i, a, main;
  for (i=0; (a = document.getElementsByTagName("link")[i]); i++) {
    if (a.getAttribute("rel").indexOf("style") != -1
        && a.getAttribute("title")) {
      a.disabled = true;
      if (a.getAttribute("title") == title) a.disabled = false;
    }
  }
}

function loadstyle() {
  var cookie = readCookie("lighting");
  var current = cookie ? cookie : getPreferredStyleSheet();
  setActiveStyleSheet(current);
}

function unloadstyle() {
  var current = getActiveStyleSheet();
  createCookie("lighting",current,365);
}

function toggleLighting() {
  var current = getActiveStyleSheet();
  var change = (current == 'Standard') ? 'Low light' : 'Standard';
  if (change == 'Low light') $('.navbar').addClass('navbar-inverse');
  else $('.navbar').removeClass('navbar-inverse');
  setActiveStyleSheet(change);
  createCookie("lighting",change,365);
  return false;
}

function $RF(el, radioGroup) {
    if($(el).type && $(el).type.toLowerCase() == 'radio') {
        radioGroup = $(el).name;
        el = $(el).form;
    } else if ($(el).tagName.toLowerCase() != 'form') {
        return false;
    }
    var checked = $(el).getInputs('radio', radioGroup).find(
        function(re) {return re.checked;}
    );
    return (checked) ? $F(checked) : null;
}

function goTo (pulldown) {
  var idx = pulldown.selectedIndex;
  if (idx != 0) {
    window.open(pulldown.options[idx].value);
  }
} 
