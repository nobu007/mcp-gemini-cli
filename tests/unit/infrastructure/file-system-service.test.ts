import { describe, it, expect, mock, spyOn } from 'bun:test';
import { FileSystemServiceImpl } from '../../../lib/infrastructure/file-system-service';
import * as fs from 'fs/promises';

mock.module('fs/promises', () => ({
  readdir: mock(() => Promise.resolve([])),
  mkdir: mock(() => Promise.resolve()),
  writeFile: mock(() => Promise.resolve()),
}));

describe('FileSystemService', () => {
  const fileSystemService = new FileSystemServiceImpl();

  it('should be defined', () => {
    expect(fileSystemService).toBeDefined();
  });

  it('getExistingSpecNames should return empty array if directory does not exist', async () => {
    const readdirMock = spyOn(fs, 'readdir').mockImplementation(() => {
      throw { code: 'ENOENT' };
    });
    const names = await fileSystemService.getExistingSpecNames('non-existent-path');
    expect(names).toEqual([]);
    readdirMock.mockRestore();
  });

  it('createDirectory should call mkdir with recursive true', async () => {
    const mkdirMock = spyOn(fs, 'mkdir');
    await fileSystemService.createDirectory('some/path');
    expect(mkdirMock).toHaveBeenCalledWith('some/path', { recursive: true });
    mkdirMock.mockRestore();
  });

  it('writeFile should call fs.writeFile with correct arguments', async () => {
    const writeFileMock = spyOn(fs, 'writeFile');
    await fileSystemService.writeFile('some/file', 'content');
    expect(writeFileMock).toHaveBeenCalledWith('some/file', 'content', 'utf-8');
    writeFileMock.mockRestore();
  });
});