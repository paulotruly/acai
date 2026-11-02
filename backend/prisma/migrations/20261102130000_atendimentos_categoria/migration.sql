-- DropIndex
DROP INDEX `AtendimentoDefesaCivil_solicitacao_idx` ON `atendimentodefesacivil`;

-- AlterTable
ALTER TABLE `atendimentodefesacivil` ADD COLUMN `ano` INTEGER NULL,
    ADD COLUMN `categoria` VARCHAR(191) NULL,
    ADD COLUMN `colunasDeslocadas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hashLinha` CHAR(64) NOT NULL,
    ADD COLUMN `tipoEventoId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `AtendimentoDefesaCivil_categoria_idx` ON `AtendimentoDefesaCivil`(`categoria`);

-- CreateIndex
CREATE INDEX `AtendimentoDefesaCivil_tipoEventoId_dataSolicitacao_idx` ON `AtendimentoDefesaCivil`(`tipoEventoId`, `dataSolicitacao`);

-- CreateIndex
CREATE INDEX `AtendimentoDefesaCivil_hashLinha_idx` ON `AtendimentoDefesaCivil`(`hashLinha`);

-- AddForeignKey
ALTER TABLE `AtendimentoDefesaCivil` ADD CONSTRAINT `AtendimentoDefesaCivil_tipoEventoId_fkey` FOREIGN KEY (`tipoEventoId`) REFERENCES `TipoEvento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

