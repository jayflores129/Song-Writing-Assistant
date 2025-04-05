"use client";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Tone from "tone";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { salamanderUrls } from "@/lib/instrument_urls";

const _chords = ["C", "D", "E", "F", "G", "A", "B"];

const itemDnD = {
  CHORD: "chord",
};

type ChordType = {
  name?: string;
  extension?: string;
  beat?: number;
  startAt?: number;
};

function Chord({ name }: { name: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: itemDnD.CHORD,
    item: { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      style={{
        opacity: isDragging ? 0.5 : 1,
        fontWeight: "bold",
        cursor: "move",
      }}
      className="text-[0.9em] shadow px-1 font-serif"
    >
      {name}
    </div>
  );
}

const ChordDropZone = ({
  onDrop,
  word,
  droppedChord,
  onChangeBeat,
  beat,
  onChangeStartAt,
  startAt,
}: {
  onDrop?: (data: any) => void;
  word: string;
  droppedChord?: any;
  onChangeBeat?: (beat: any) => void;
  beat?: any;
  onChangeStartAt?: (value: number) => void;
  startAt?: number;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: itemDnD.CHORD,
    drop: (item: any) => onDrop && onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      className={cn(
        "flex relative h-full transition-[width] duration-300 resize-x",
        isOver && "bg-blue-200",
        (isOver || !word) && "min-w-4",
        droppedChord && !word && "min-w-6"
      )}
    >
      {droppedChord && (
        <Popover>
          <PopoverTrigger asChild>
            <span className="text-[0.7em] bg-gray-200 absolute bottom-[30px] font-bold px-1 font-serif cursor-pointer">
              {droppedChord}
            </span>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            className="drop-shadow-md border-0"
          >
            <div className="flex gap-2">
              <div className="w-1/2 flex flex-col">
                <p>Start At</p>
                <input
                  type="number"
                  value={startAt}
                  onChange={(e: any) =>
                    onChangeStartAt && onChangeStartAt(e.target.value)
                  }
                  className="border p-1 w-full"
                />
              </div>
              <div className="w-1/2 flex flex-col">
                <p>Beats</p>
                <select
                  className="border p-1 w-full"
                  value={beat}
                  onChange={(e) => onChangeBeat && onChangeBeat(e.target.value)}
                >
                  <option value=""></option>
                  <option value="1">1 beat</option>
                  <option value="2">2 beats</option>
                  <option value="3">3 beats</option>
                  <option value="4">4 beats</option>
                  <option value="5">5 beats</option>
                  <option value="6">6 beats</option>
                </select>
              </div>
            </div>

            <PopoverPrimitive.Arrow
              className="fill-white drop-shadow-md"
              width={20}
              height={10}
            />
          </PopoverContent>
        </Popover>
      )}
      <span>{word}</span>
    </div>
  );
};

export default function Page() {
  const [data, setData] = useState<any>([]);
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  const lyricEditorRef = useRef<HTMLTextAreaElement>(null);
  const [lyricEditorValue, setLyricEditorValue] = useState("");
  const [lyricSelectedKeys, setLyricSelectedKeys] =
    useState<[dataKey: number, wordKey: number]>();

  const onChangeInput = (e: any, dataKey: any, workKey?: any) => {
    const splitValue = e.target.value?.split("\n");

    const flatMap = (word: any, key: number, sentenceLength: number) => {
      if (key === sentenceLength - 1) return ["", word, ""];
      return ["", word];
    };

    if (workKey >= 0 && splitValue.length === 1) {
      const _data = [...data];
      const sentences = e.target.value.replace(/\s+/g, " ").trim().split(" ");
      const words = sentences.flatMap((word: any, key: number) =>
        flatMap(word, key, sentences.length)
      );
      _data[dataKey].sentences[workKey].words = words;
      setData(_data);
    }

    if (workKey >= 0) return;

    if (splitValue?.length > 1) {
      const sentences = splitValue.map((sentence: any) => {
        const sentences = sentence.split(" ");
        const words = sentences.flatMap((word: any, key: number) =>
          flatMap(word, key, sentences.length)
        );
        return {
          words,
          ref: createRef(),
        };
      });
      const _data = [...data];
      _data[dataKey].sentences = sentences;
      setData(_data);

      setTimeout(() => {
        if (sentences?.[sentences.length - 1]) {
          sentences?.[sentences.length - 1]?.ref?.current?.click();
        }
      }, 100);
      e.target.value = "";
    }
  };

  const onBlurSentence = (e: any, dataKey: number, wordKey: number) => {
    let _data: any = [...data];
    let sentences = _data[dataKey].sentences;
    if (!e.target.value) {
      sentences?.splice(wordKey, 1);
      setData(_data);
      return;
    }
  };

  const onClickLyricLine = (e: any, key: number, key2: number) => {
    if (!Array.isArray(data) && !e.currentTarget) return;
    const _data = [...data];
    const sentence = _data[key]?.sentences?.[key2];
    const bound = e.currentTarget.getBoundingClientRect();
    const textContent = sentence?.words?.join(" ");
    setLyricSelectedKeys([key, key2]);
    setLyricEditorValue(textContent);
    if (lyricEditorRef.current) {
      const inputStyle: any = {
        top: `${bound.top}px`,
        left: `${bound.left}px`,
        width: `${bound.width}px`,
        height: `${bound.height}px`,
        wordSpacing: "0.25rem",
        lineHeight: 1.5,
      };
      for (const prop in inputStyle) {
        lyricEditorRef.current.style[prop as any] = inputStyle[prop];
      }
      setTimeout(() => {
        lyricEditorRef.current?.focus();
      });
    }
  };

  const onAddSection = (name: string) => {
    const insertData = {
      name,
      sentences: [],
      editableRef: createRef<any>(),
    };
    setData((prevData: any) => [...prevData, insertData]);
    setTimeout(() => {
      if (insertData?.editableRef?.current) {
        insertData?.editableRef?.current?.focus();
      }
    });
  };

  const onDropChord = (
    dropItem: any,
    dataKey: number,
    sentenceKey: number,
    wordKey: number
  ) => {
    setData((prevData: any) => {
      const newData = [...prevData];

      const sentence = newData[dataKey]?.sentences?.[sentenceKey];
      if (!sentence || !Array.isArray(sentence.words)) return prevData;

      sentence.chords = sentence.chords
        ? [...sentence.chords]
        : Array(sentence.words.length).fill(undefined);

      sentence.chords[wordKey] = {
        name: dropItem?.name,
        extension: [],
        beat: 4,
        startAt: 0,
      };

      return newData;
    });
  };

  const onChangeBeat = (
    beat: any,
    dataKey: number,
    sentenceKey: number,
    chordKey: number
  ) => {
    setData((prevData: any) => {
      const newData = [...prevData];

      const sentence = newData[dataKey]?.sentences?.[sentenceKey];
      if (!sentence || !Array.isArray(sentence.words)) return prevData;

      sentence.chords = sentence.chords
        ? [...sentence.chords]
        : Array(sentence.words.length).fill(undefined);

      const chords: ChordType[] = sentence.chords;

      chords[chordKey] = {
        ...chords[chordKey],
        beat,
      };

      return newData;
    });
  };

  const onChangeStartAt = (
    startAt: any,
    dataKey: number,
    sentenceKey: number,
    chordKey: number
  ) => {
    setData((prevData: any) => {
      const newData = [...prevData];

      const sentence = newData[dataKey]?.sentences?.[sentenceKey];
      if (!sentence || !Array.isArray(sentence.words)) return prevData;

      sentence.chords = sentence.chords
        ? [...sentence.chords]
        : Array(sentence.words.length).fill(undefined);

      const chords: ChordType[] = sentence.chords;

      chords[chordKey] = {
        ...chords[chordKey],
        startAt,
      };

      return newData;
    });
  };

  console.log(data);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-items gap-2 p-3">
        {_chords.map((chord: any, key: number) => (
          <Chord name={chord} key={key} />
        ))}
      </div>

      <Button
        className="m-3"
        onClick={async () => {
          const sampler = new Tone.Sampler({
            urls: salamanderUrls,
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
          }).toDestination();

          Tone.loaded().then(() => {
            const chords = data
              ?.flatMap((d: any) => {
                const chords: ChordType[] = d?.sentences?.flatMap(
                  (s: any) => s.chords
                );
                return Array.isArray(chords) ? chords : [];
              })
              .filter(Boolean);

            const transport = Tone.getTransport();

            const part = new Tone.Part(
              (time, chord) => {
                const note = `${chord.name}3`;
                const duration = chord.beat;

                sampler.triggerAttackRelease(note, duration, time);
              },
              chords.map((chord: ChordType) => [chord.startAt, chord])
            );

            part.start(0);
            transport.start();
          });
        }}
      >
        Play
      </Button>

      <textarea
        className="w-0 h-0 resize-none px-[4px] fixed tracking-2 overflow-hidden z-10"
        ref={lyricEditorRef}
        value={lyricEditorValue || ""}
        onChange={(e) => {
          setLyricEditorValue(e.target.value);
          if (lyricSelectedKeys?.length === 2) {
            onChangeInput(e, lyricSelectedKeys[0], lyricSelectedKeys[1]);
          }
        }}
        onBlur={(e) => {
          e.target.style.width = "0px";
          e.target.style.height = "0px";
          e.target.style.top = "";
          e.target.style.left = "";
          if (lyricSelectedKeys?.length === 2) {
            onBlurSentence(e, lyricSelectedKeys[0], lyricSelectedKeys[1]);
          }
          setLyricEditorValue("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const _data = [...data];
            if (lyricSelectedKeys?.length === 2) {
              const sentenceNewKey = lyricSelectedKeys[1] + 1;
              const sentences = _data[lyricSelectedKeys[0]]?.sentences;
              if (Array.isArray(sentences)) {
                const sentence = {
                  words: [""],
                  ref: createRef<any>(),
                };
                sentences.splice(sentenceNewKey, 0, sentence);
                setData(_data);
                setTimeout(() => {
                  sentence.ref.current?.click();
                });
              }
            }
          }
        }}
      ></textarea>

      <div className="container mx-auto py-2">
        <div className="flex flex-col gap-5">
          {Array.isArray(data) &&
            data.map((item: any, key: number) => (
              <div key={key} className="flex flex-col">
                <p className="text-[0.85em] capitalize w-fit px-2 mb-6 font-medium">
                  [{item.name}]
                </p>
                <div className="flex flex-col gap-3">
                  {Array.isArray(item.sentences) &&
                    item.sentences.map((sentence: any, sentenceKey: number) => (
                      <React.Fragment key={sentenceKey}>
                        <div
                          ref={sentence.ref}
                          className="h-[32px] flex items-start px-[4px]"
                          // onClick={(e) => onClickLyricLine(e, key, sentenceKey)}
                        >
                          {Array.isArray(sentence?.words) &&
                            sentence.words.map((word: any, wordKey: number) => {
                              const chord: ChordType =
                                sentence?.chords?.[wordKey];

                              return (
                                <React.Fragment key={wordKey}>
                                  <ChordDropZone
                                    word={word}
                                    beat={chord?.beat}
                                    startAt={chord?.startAt}
                                    droppedChord={chord?.name}
                                    onChangeStartAt={(startAt) =>
                                      onChangeStartAt(
                                        startAt,
                                        key,
                                        sentenceKey,
                                        wordKey
                                      )
                                    }
                                    onChangeBeat={(beat) =>
                                      onChangeBeat(
                                        beat,
                                        key,
                                        sentenceKey,
                                        wordKey
                                      )
                                    }
                                    onDrop={(dropItem) => {
                                      onDropChord(
                                        dropItem,
                                        key,
                                        sentenceKey,
                                        wordKey
                                      );
                                    }}
                                  />
                                </React.Fragment>
                              );
                            })}
                        </div>
                      </React.Fragment>
                    ))}
                </div>
                {item.sentences?.length === 0 && (
                  <textarea
                    ref={item.editableRef}
                    onChange={(e) => onChangeInput(e, key)}
                    className={cn(
                      "bg-gray-100 px-2 h-[36px] leading-9 resize-none flex items-center"
                    )}
                    placeholder="Enter lyrics here"
                  />
                )}
              </div>
            ))}

          <div className="flex items-center gap-2">
            <Button size={"sm"} onClick={() => onAddSection("intro")}>
              <Plus width={15} height={15} /> Intro
            </Button>
            <Button size={"sm"} onClick={() => onAddSection("verse")}>
              <Plus width={15} height={15} /> Verse
            </Button>
            <Button size={"sm"} onClick={() => onAddSection("chorus")}>
              <Plus width={15} height={15} /> Chorus
            </Button>
            <Button size={"sm"} onClick={() => onAddSection("bridge")}>
              <Plus width={15} height={15} /> Bridge
            </Button>
            <Button size={"sm"} onClick={() => onAddSection("outro")}>
              <Plus width={15} height={15} /> Outro
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
