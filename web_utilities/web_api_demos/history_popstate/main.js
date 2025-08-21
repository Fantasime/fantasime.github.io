function pushHistory() {
  var state = {
    title: 'title',
    url: '#'
  };
  window.history.pushState(state, 'title', '#');
}

function listenNavBack(callback) {
  pushHistory();

  // var bool = false;
  // setTimeout(function() {
  //   bool = true;
  // }, 1500);

  var hasUserInteraction = false;

  window.addEventListener(
    'popstate',
    function(e) {
      // alert('QAQ');
      // if (bool) {
        callback(e);
      // }
      pushHistory();
    },
    false
  );
};

function _initNavBack() {
  listenNavBack(() => {
    alert('回退拦截');
  });
}

function ua() {
  return navigator.userAgent;
}

_initNavBack();
