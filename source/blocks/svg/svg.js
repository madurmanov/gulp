$(function() {
  $('[data-svgicon]').each(function() {
    var $this = $(this),
        icon = $this.data('svgicon');
    $this.after($('<svg class="svgicon"><use xlink:href="#svgicon-' + icon + '"></svg>')).remove();
  });
});
