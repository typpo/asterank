import locale

def register_filters(app):
  @app.template_filter('format_number')
  def format_number(value, form='%d'):
    locale.setlocale(locale.LC_ALL, "")
    if value > 0:
      result = locale.format(form, value, True)
    else:
      result = 'na'
    return result
