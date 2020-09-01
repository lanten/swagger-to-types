import path from 'path'
import { Uri } from 'vscode'

import { EXT_PATH } from './'

export const icons = {
  back: {
    light: Uri.file(path.join(EXT_PATH, 'assets/icons/back.light.svg')),
    dark: Uri.file(path.join(EXT_PATH, 'assets/icons/back.dark.svg')),
  },
}
