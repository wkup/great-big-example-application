import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs/observable/of';
import { cold, hot } from 'jasmine-marbles';
import { empty, Observable } from 'rxjs';
import { Database } from '@ngrx/db';
import 'rxjs/add/operator/toBeObservable';

import { CollectionEffects } from './collection.effects';
import { Book } from '../book/book.model';
import * as IDActions from '../id/id.actions';
import { slices } from '../util';

describe('CollectionEffects', () => {
    let db: any;
    let effects: CollectionEffects;
    let actions$: Observable<any>;

    const book1 = { id: '111', volumeInfo: {} } as Book;
    const book2 = { id: '222', volumeInfo: {} } as Book;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                CollectionEffects,
                {
                    provide: Database,
                    useValue: {
                        open: jest.fn(),
                        query: jest.fn(),
                        insert: jest.fn(),
                        executeWrite: jest.fn()
                    }
                },
                provideMockActions(() => actions$)
            ]
        });

        db = TestBed.get(Database);
        effects = TestBed.get(CollectionEffects);
        actions$ = TestBed.get(Actions);
    });

    describe('openDB$', () => {
        it('should call db.open when initially subscribed to', () => {
            effects.openDB$.subscribe();
            expect(db.open).toHaveBeenCalledWith('books_app');
        });
    });

    describe('loadCollection$', () => {
        it('should return a IDActions.LoadSuccess, with the books, on success', () => {
            const action = new IDActions.Load(slices.COLLECTION);
            const completion = new IDActions.LoadSuccess(slices.COLLECTION, [book1, book2]);

            actions$ = hot('-a', { a: action });
            const response = cold('-a-b|', { a: book1, b: book2 });
            const expected = cold('-----c', { c: completion });
            db.query = jest.fn(() => response);

            expect(effects.loadCollection$).toBeObservable(expected);
        });

        it('should return a IDActions.LoadFail, if the query throws', () => {
            const action = new IDActions.Load(slices.COLLECTION);
            const error = 'Error!';
            const completion = new IDActions.LoadFail(slices.COLLECTION, error);

            actions$ = hot('-a', { a: action });
            const response = cold('-#', {}, error);
            const expected = cold('--c', { c: completion });
            db.query.and.returnValue(response);

            expect(effects.loadCollection$).toBeObservable(expected);
        });
    });

    describe('addBookToCollection$', () => {
        it('should return a IDActions.AddSuccess, with the book, on success', () => {
            const action = new IDActions.Add(slices.COLLECTION, book1);
            const completion = new IDActions.AddSuccess(slices.COLLECTION, book1);

            actions$ = hot('-a', { a: action });
            const response = cold('-b', { b: true });
            const expected = cold('--c', { c: completion });
            db.insert.and.returnValue(response);

            expect(effects.addBookToCollection$).toBeObservable(expected);
            expect(db.insert).toHaveBeenCalledWith('books', [book1]);
        });

        it('should return a IDActions.AddFail, with the book, when the db insert throws', () => {
            const action = new IDActions.Add(slices.COLLECTION, book1);
            const completion = new IDActions.AddFail(slices.COLLECTION, book1);
            const error = 'Error!';

            actions$ = hot('-a', { a: action });
            const response = cold('-#', {}, error);
            const expected = cold('--c', { c: completion });
            db.insert.and.returnValue(response);

            expect(effects.addBookToCollection$).toBeObservable(expected);
        });

        describe('removeBookFromCollection$', () => {
            it('should return a IDActions.DeleteSuccess, with the book, on success', () => {
                const action = new IDActions.Delete(slices.COLLECTION, book1);
                const completion = new IDActions.DeleteSuccess(slices.COLLECTION, book1);

                actions$ = hot('-a', { a: action });
                const response = cold('-b', { b: true });
                const expected = cold('--c', { c: completion });
                db.executeWrite.and.returnValue(response);

                expect(effects.removeBookFromCollection$).toBeObservable(expected);
                expect(db.executeWrite).toHaveBeenCalledWith('books', 'delete', [book1.id]);
            });

            it('should return a IDActions.DeleteFail, with the book, when the db insert throws', () => {
                const action = new IDActions.Delete(slices.COLLECTION, book1);
                const completion = new IDActions.DeleteFail(slices.COLLECTION, book1);
                const error = 'Error!';

                actions$ = hot('-a', { a: action });
                const response = cold('-#', {}, error);
                const expected = cold('--c', { c: completion });
                db.executeWrite.and.returnValue(response);

                expect(effects.removeBookFromCollection$).toBeObservable(expected);
                expect(db.executeWrite).toHaveBeenCalledWith('books', 'delete', [book1.id]);
            });
        });
    });
});
