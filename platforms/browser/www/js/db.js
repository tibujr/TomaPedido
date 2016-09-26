document.addEventListener('deviceready', function() {
  window.sqlitePlugin.selfTest(function() {
    console.log('SELF test OK');
  });
});