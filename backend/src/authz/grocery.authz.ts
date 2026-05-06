import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  buildMongoQueryMatcher,
  MongoQuery,
  PureAbility,
} from '@casl/ability';
import { Role } from '@prisma/client';
import { AbilityAction } from '../enums';
import { ISession } from './session.types';

export class GroceryAuthZEntity {
  public readonly id: string | null;

  constructor({ id }: { id?: string | null }) {
    this.id = id ?? null;
  }
}

type GroceryAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof GroceryAuthZEntity>
>;
const GroceryAbilityClass = PureAbility as AbilityClass<GroceryAbility>;

export class GroceryAbilityBuilder {
  private abilityBuilder: AbilityBuilder<GroceryAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(GroceryAbilityClass);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.role === Role.ADMIN) {
      builder.can(AbilityAction.Manage, GroceryAuthZEntity);
    }

    if (this.session.user.role === Role.USER) {
      builder.can(AbilityAction.Read, GroceryAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
