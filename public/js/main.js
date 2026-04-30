(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    document.querySelectorAll('form[data-confirm]').forEach(function (form) {
      form.addEventListener('submit', function (ev) {
        var msg = form.getAttribute('data-confirm') || '';
        if (!window.confirm(msg)) ev.preventDefault();
      });
    });

    var skip = document.querySelector('a[href="#main-content"]');
    if (skip) {
      skip.addEventListener('click', function () {
        var target = document.getElementById('main-content');
        if (target) target.setAttribute('tabindex', '-1');
      });
    }

    var drawer = document.getElementById('main-nav-drawer');
    if (drawer) {
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && drawer.checked) {
          drawer.checked = false;
        }
      });
    }

    document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-copy-target');
        var input = id ? document.getElementById(id) : null;
        if (!input) return;
        input.select();
        input.setSelectionRange(0, 99999);
        try {
          navigator.clipboard.writeText(input.value).then(function () {
            var prev = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(function () {
              btn.textContent = prev;
            }, 1500);
          });
        } catch (e1) {
          /* ignore */
        }
      });
    });

    try {
      var url = new URL(window.location.href);
      if (url.searchParams.has('reveal')) {
        url.searchParams.delete('reveal');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      }
    } catch (e2) {
      /* ignore */
    }
  });
})();
