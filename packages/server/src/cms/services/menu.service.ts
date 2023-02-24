import { Injectable, Inject } from '@nestjs/common';
import { In, Like, Raw, MongoRepository, ObjectID } from 'typeorm';
import { Menu } from '../entities/menu.mongo.entity'
import { PaginationParams2Dto } from '../../shared/dtos/pagination-params.dto'
import { CreateMenuDto, UpdateMenuDto } from '../dtos/menu.dto';
import * as fs from 'fs'
import * as compressing from 'compressing'
import { ArticleService } from './article.service';
import * as path from 'path'
import { UploadService } from '../../shared/upload/upload.service';
@Injectable()
export class MenuService {
  constructor(
    @Inject('MENU_REPOSITORY')
    private MenuRepository: MongoRepository<Menu>,

    @Inject('ARTICLE_REPOSITORY')
    private articleRepository: MongoRepository<Menu>,

    private articleService: ArticleService,

    private uploadService: UploadService

  ) { }



  async find(): Promise<{ data: object }> {

    const data = await this.MenuRepository.findOneBy({})

    data && delete data._id
    return {
      data: data ? data : { menus: {} }
    }
  }


  async update(data: UpdateMenuDto) {
    // 去除时间戳和id
    ['_id', 'createdAt', 'updatedAt'].forEach(
      k => delete data[k]
    )
    return await this.MenuRepository.updateOne({}, { $set: data }, { upsert: true })
  }


  async import(file) {

    const { path: uploadPath } = await this.uploadService.upload(file)

    const root = uploadPath.replace(path.extname(uploadPath), '')
    await compressing.zip.uncompress(uploadPath, root)


    this.articleRepository.deleteMany({});


    // const root = path.resolve('../../contents/大班车测试内容');
    const list = fs.readdirSync(root)
      .filter(menu => fs.statSync(root + '/' + menu).isDirectory());
    const menus = [];
    for (const menu of list) {
      menus.push(await this.importCategory(menu, root + '/' + menu));
    }
    console.log('list', JSON.stringify(menus));
    await this.update({ menus });

    await fs.rmSync(uploadPath)
    await fs.rmdirSync(root, { recursive: true })

  }

  async importCategory(name, category) {
    console.log('importDir ......', category);
    const list = fs.readdirSync(category)
      .filter(v => fs.statSync(category + '/' + v).isDirectory());

    const children = [];
    for (const article of list) {
      children.push(await await this.importArticle(article, category + '/' + article));
    }
    return {
      key: Date.now().toString(),
      title: name,
      type: 'category',
      children
    };
  }
  async importArticle(title, dir) {
    console.log('importArticle ......', dir);
    const content = fs.readFileSync(dir + '/' + title + '.md').toString();
    const { _id } = await this.articleService.create({ title, content });
    console.log('创建文章成功', _id);
    return { key: _id, title, type: 'article' };
  }


}
