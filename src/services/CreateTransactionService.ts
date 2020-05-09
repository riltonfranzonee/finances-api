// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid transaction type');
    }

    if (type === 'outcome' && value > total) {
      throw new AppError('Outcome cannot be greater than total balance');
    }

    const [categoryFound] = await categoriesRepository.find({
      where: { title: category },
    });

    let category_id = categoryFound ? categoryFound.id : undefined;

    if (!categoryFound) {
      const newCategory = categoriesRepository.create({ title: category });
      await categoriesRepository.save(newCategory);

      category_id = newCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
