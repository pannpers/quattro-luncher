import { getLogger } from 'aurelia-logging'
import { format } from 'date-fns'

export class FormatValueConverter {
  private readonly logger = getLogger(FormatValueConverter.name)

  toView(value: Date, pattern?: string): string {
    if (value instanceof Date) {
      return format(value, 'yyyy-MM-dd')
    }
    this.logger.warn('Passed value is not Date instance:', value)

    return value
  }
}
