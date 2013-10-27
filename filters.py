
@app.template_filter('format_number')
def format_number(value, form='%n'):
    locale.setlocale(locale.LC_ALL, "")
    if value > 0:
        result = locale.format(form, value, True)
    else:
        result = 'na'
    return result
