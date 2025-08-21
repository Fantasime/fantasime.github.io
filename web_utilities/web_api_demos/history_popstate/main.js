function pushHistory() {
  var state = {
    title: 'title',
    url: '#'
  };
  window.history.pushState(state, 'title', '#');
}

function listenNavBack(callback) {
  pushHistory();

  window.addEventListener(
    'popstate',
    function(e) {
      callback(e);
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
