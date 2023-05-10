import { GlobalModifier, Tag } from "../data/item";
import { Data, tagRegex, Config, CodeBlock } from "../utils";
import {
	HoverProvider,
	Hover,
	TextDocument,
	CancellationToken,
	Position,
	MarkdownString,
} from "vscode";

export default class MTMLHoverProvider implements HoverProvider {
	public provideHover(
		document: TextDocument,
		position: Position,
		token: CancellationToken
	): Hover | undefined {
		// 取得したい文字列の正規表現
		const hoverRegex = /[0-9a-zA-Z:_]+=?/i;

		const hoverRange = document.getWordRangeAtPosition(position, hoverRegex);
		const tagRange = document.getWordRangeAtPosition(position, tagRegex);
		if (!hoverRange || !tagRange) {
			//どちらかがundefinedだった時点で終了
			return undefined;
		}

		// mtタグの中で何かしらの要素にホバーしている状況
		const hoverText = document.getText(hoverRange);
		const tagText = document.getText(tagRange);
		const tagStructure = tagText.split(/\s+/);
		// console.log("1.1. hover text is :" + hoverText);
		// console.log("1.2. tag text is   :" + tagText);
		// console.log("1.3. tag structure is :" + tagStructure.join(", "));

		const tagItemId = tagStructure[0].replace(/[<:$]/g, "");
		// console.log("1.4. tag item id is :" + tagItemId);
		let tagItem = Data.getTagById(tagItemId);
		// console.log("1.5. tagItem is :", tagItem.name);

		let modifierItem = Data.getGlobalModifierById(
			hoverText.replace(/(:\w+)?=$/, "").toLowerCase()
		);

		return new Hover(this.makeMarkdownString(tagItem, modifierItem));
	}

	readonly makeMarkdownString = (
		tag: Tag,
		globalModifier: GlobalModifier | undefined
	): MarkdownString => {
		const markdownString = new MarkdownString();
		const tagModifiers = Object.values(tag.modifiers);

		// グローバルモディファイアの表示
		if (globalModifier) {
			markdownString.appendCodeblock(
				CodeBlock.withGlobalModifier(tag, globalModifier)
			);
			markdownString.appendMarkdown(
				`${globalModifier.description}` +
					`\n\n[${Config.CMS.getName()} ${globalModifier.name} Reference](${
						globalModifier.url
					})`
			);
		}
		markdownString.appendCodeblock(CodeBlock.codeBlock(tag));
		markdownString.appendMarkdown(`\n${tag.description}`);

		if (tagModifiers.length > 0) {
			markdownString.appendMarkdown(`\n\nmodifiers`);
			markdownString.appendMarkdown(
				tagModifiers
					.map((modifier) => {
						return (
							`\n- ${CodeBlock.localModifier(modifier)}` +
							`\n\t- ${
								modifier.description === ""
									? "no description"
									: modifier.description
							}`
						);
					})
					.join("")
			);
		}

		markdownString.appendMarkdown(
			`\n\n[${Config.CMS.getName()} ${tag.name} Reference](${tag.url})`
		);
		// console.log("makeMarkdownString :" + markdownString.value);

		return markdownString;
	};
}
